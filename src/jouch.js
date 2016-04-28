/**
 * FiltrES provides filtres.compile() to compile user expressions to an ElasticSearch query.
 *
 * See https://github.com/abeisgreat/filtres for tutorial, reference and examples.
 * MIT License - based on Filtrex by Joe Walnes (https://github.com/joewalnes/filtrex) 
 *
 * Includes Jison by Zachary Carter. See http://jison.org/
 *
 * -Abe Haskins (originally Joe Walnes)
 */

//var queryBase = '{"query" : {"filtered" : { "filter": [';
//var queryEnd = ']}}}';
var queryCleaner = /\$|\.|\(|\)|\=|\~|\[|\]|\!|\<|\>|\'|\"|\+/g;
var debug = false;


function compileExpression(expression, failToQuerystring) {
  if (!compileExpression.parser) {
    // Building the original parser is the heaviest part. Do it
    // once and cache the result in our own function.
    compileExpression.parser = filtrexParser();
  }

  var tree, queryIsValid = true;

  try {
    tree = compileExpression.parser.parse(expression);

    var js = [];
    //js.push(queryBase);
    function toJs(node) {
      if (Array.isArray(node)) {
        node.forEach(toJs);
      } else {
        // For whatever reason $and and $or get parsed by json into $$[$0-1]
        // so I'm hackily ouputing $jand and $jor and replacing them before
        // parsing to JSON
        node = node.replace('$jand', '$and');
        node = node.replace('$jor', '$or');
        js.push(node);
      }
    }
    tree.forEach(toJs);
    //js.push(queryEnd);
  } catch (err) {
    if (debug) console.log(err);
    queryIsValid = false;
  }

  if (debug) console.log(expression, tree, js);

  try {
    return JSON.parse(js.join(''));
  } catch (err) {
    if (debug) console.log(js, err);
    queryIsValid = false;
  }

  if (failToQuerystring) {
    return {
      "query" : {
        "query_string" : {
          "query": expression.replace(queryCleaner, '')
        }
      }
    };
  } else {
    if (debug) console.log("ERROR", js && js.length? js.join('') : 'Parse failed');
    throw "Invalid Query";
  }
}

function filtrexParser() {

  // Language parser powered by Jison <http://zaach.github.com/jison/>,
  // which is a pure JavaScript implementation of
  // Bison <http://www.gnu.org/software/bison/>.

  var Jison = require('jison')

  function code(args, skipParentheses) {
    skipParentheses = true;
    var argsJs = args.map(function(a) {
      return typeof(a) == 'number' ? ('$' + a) : JSON.stringify(a);
    }).join(',');

    return skipParentheses
        ? '$$ = [' + argsJs + '];'
        : '$$ = ["(", ' + argsJs + ', ")"];';
  }

  var grammar = {
    // Lexical tokens
    lex: {
      rules: [
        /*['\\*', 'return "*";'],
        ['\\/', 'return "/";'],
        ['-'  , 'return "-";'],
        ['\\+', 'return "+";'],
        ['\\^', 'return "^";'],
        ['\\%', 'return "%";'],*/
        ['\\(', 'return "(";'],
        ['\\)', 'return ")";'],
        ['\\,', 'return ",";'],
        ['==', 'return "==";'],
        ['\\!=', 'return "!=";'],
        ['>=', 'return ">=";'],
        ['<=', 'return "<=";'],
        ['<', 'return "<";'],
        ['>', 'return ">";'],
        //['~=', 'return "~=";'],
        //['~!=', 'return "~!=";'],
        //['\\?', 'return "?";'],
        //['\\:', 'return ":";'],
        ['and[^\\w]', 'return "and";'],
        ['or[^\\w]' , 'return "or";'],
        ['not[^\\w]', 'return "not";'],
        ['in[^\\w]', 'return "in";'],

        ['\\s+',  ''], // skip whitespace
        ['[0-9]+(?:\\.[0-9]+)?\\b', 'return "NUMBER";'], // 212.321
        ['[a-zA-Z][\\.a-zA-Z0-9_]*', 'return "SYMBOL";'], // some.Symbol22
        ['"(?:[^"])*"', 'yytext = yytext.substr(1, yyleng-2); return "STRING";'], // "foo"

        // End
        ['$', 'return "EOF";'],
      ]
    },
    // Operator precedence - lowest precedence first.
    // See http://www.gnu.org/software/bison/manual/html_node/Precedence.html
    // for a good explanation of how it works in Bison (and hence, Jison).
    // Different languages have different rules, but this seems a good starting
    // point: http://en.wikipedia.org/wiki/Order_of_operations#Programming_languages
    operators: [
      //['left', '?', ':'],
      ['left', 'or'],
      ['left', 'and'],
      ['left', 'in'],
      ['left', '==', '!='],
      ['left', '<', '<=', '>', '>='],
      //['left', '~=', '~!='],
      //['left', '+', '-'],
      //['left', '*', '/', '%'],
      //['left', '^'],
      ['left', 'not'],
      ['left', 'UMINUS'],
    ],
    // Grammar
    bnf: {
      expressions: [ // Entry point
        ['e EOF', 'return $1;']
      ],
      e: [
        // Math operations (maybe client-side?)
        /*
        ['e + e'  , code([1, '+', 3])],
        ['e - e'  , code([1, '-', 3])],
        ['e * e'  , code([1, '*', 3])],
        ['e / e'  , code([1, '/', 3])],
        ['e % e'  , code([1, '%', 3])],
        ['e ^ e'  , code(['Math.pow(', 1, ',', 3, ')'])],
        */

        // Comparisons  
        ['- e'    , code(['-', 2]), {prec: 'UMINUS'}],                        // done
        // hacky $jand and $jor since $and and $or seem to mean something
        // in jison. I don't know what I'm doing
        // TODO: fix this hacky mess
        ['e and e', code(['{"$jand": [', 1, ', ', 3, ']}'])],               // done
        ['e or e' , code(['{"$jor": [', 1, ', ', 3, ']}'])],             // done
        ['not e'  , code(['{"bool": { "must_not": [', 2, ']}}'])],                  // done
        ['e == e' , code(['{"', 1, '": {"$eq":', 3, '}}'])],                    // done
        ['e != e' , code(['{"', 1, '": {"$ne":', 3, '}}'])],      // done

        //['e ~= STRING' , code(['{"bool": { "must": { "regexp": {"', 1, '": "', 3, '"}}}}'])],   // done
        //['e ~!= STRING' , code(['{"bool": { "must_not": { "regexp": {"', 1, '": "', 3, '"}}}}'])],  // done

        ['e < e'  , code(['{"', 1, '": {"$lt": ' , 3, '}}'])],              // done
        ['e <= e' , code(['{"', 1, '": {"$lte": ' , 3, '}}'])],             // done
        ['e > e'  , code(['{"', 1, '": {"$gt": ' , 3, '}}'])],              // done
        ['e >= e' , code(['{"', 1, '": {"$gte": ' , 3, '}}'])],             // done
        //['e ? e : e', code([1, '?', 3, ':', 5])],         
        ['( e )'  , code([2])],                                   // done

        // Literals
        ['NUMBER' , code([1])],                                   // done
        ['STRING' , code(['"', 1, '"'])],                             // done
        ['SYMBOL' , code([1])],                                   // done

        // Functions
        //['SYMBOL ( argsList )', code(['functions.', 1, '(', 3, ')'])],
        //['e in ( inSet )', code([1, ' in (function(o) { ', 4, 'return o; })({})'])],
        //['e not in ( inSet )', code(['!(', 1, ' in (function(o) { ', 5, 'return o; })({}))'])],
      ],/*
      argsList: [
        ['e', code([1], true)],
        ['argsList , e', code([1, ',', 3], true)],
      ],
      inSet: [
        ['e', code(['o[', 1, '] = true; '], true)],
        ['inSet , e', code([1, 'o[', 3, '] = true; '], true)],
      ]*/
    }
  };
  return new Jison.Parser(grammar);
}

var filtres = {
  compile: compileExpression
};

module.exports = filtres;
