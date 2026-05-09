const TOKENIZER_STATE = {
    DEFAULT: 'DEFAULT',
    IN_WORD: 'IN_WORD',
    IN_NUMBER: 'IN_NUMBER',
    IN_COMMENT: 'IN_COMMENT',
    IN_STRING: 'IN_STRING',
}

const COMMENT_TYPE = {
    SINGLE_LINE: 'SINGLE_LINE',
    MULTI_LINE: 'MULTI_LINE',
}

const TOKEN_TYPE = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    COMMENT: 'COMMENT',
    WHITESPACE: 'WHITESPACE',
    OPERATOR: 'OPERATOR',
    PUNCTUATION: 'PUNCTUATION',
    IS_NEWLINE: 'IS_NEWLINE',
}

// identifier start must be alphabetic
const isCurrentCharacterAWordStart = (currentCharacter) => {
    return (currentCharacter >= 'a' && currentCharacter <= 'z') ||
        (currentCharacter >= 'A' && currentCharacter <= 'Z');
}

// identifier continuation can include underscore and dollar sign
const isCurrentCharacterAWordPart = (currentCharacter) => {
    return isCurrentCharacterAWordStart(currentCharacter) || currentCharacter === '_' || currentCharacter === '$';
}

// check if number lies between 0 and 9
const isCurrentCharacterANumber = (currentCharacter) => {
    return currentCharacter >= '0' && currentCharacter <= '9';
}

const isCurrentCharacterAWhiteSpace = (currentCharacter) => {
    return currentCharacter === ' ' || currentCharacter === '\t';
}

// check for comments - single line comment starts with // and multi line comment starts with /* and ends with */
const isThisTheStartOfAComment = (currentCharacter, nextCharacter) => {
    return (currentCharacter === '/' && nextCharacter === '/') ||
        (currentCharacter === '/' && nextCharacter === '*');
}

const getCommentType = (currentCharacter, nextCharacter) => {
    return nextCharacter === '/' ? COMMENT_TYPE.SINGLE_LINE : COMMENT_TYPE.MULTI_LINE;
}

const isThisTheEndOfAComment = (commentType, currentCharacter, nextCharacter) => {
    if (commentType === COMMENT_TYPE.SINGLE_LINE) {
        return currentCharacter === '\n';
    }
    return currentCharacter === '*' && nextCharacter === '/';
}

// check for string - string starts and ends with " or '
// also check for escape character \ before " or ' to avoid ending the string
const isThisTheStartOfAString = (currentCharacter) => {
    return currentCharacter === '"' || currentCharacter === "'" || currentCharacter === '`';
}

const isEscapedStringDelimiter = (code, index) => {
    let backslashCount = 0;
    for (let i = index - 1; i >= 0 && code[i] === '\\'; i--) {
        backslashCount++;
    }
    return backslashCount % 2 === 1;
}

const KEYWORDS = new Set([
    "const", "let", "var",
    "if", "else", "else if",
    "for", "while", "do",
    "function", "return",
    "class", "new", "this",
    "import", "export", "default",
    "try", "catch", "finally",
    "throw", "typeof", "instanceof",
    "true", "false", "null", "undefined",
    "break", "continue", "switch", "case"
]);

const OPERATORS = [
    "+", "-", "*", "/", "%",
    "=", "+=", "-=", "*=", "/=",
    "==", "===", "!=", "!==",
    ">", "<", ">=", "<=",
    "&&", "||", "!",
    "++", "--",
].sort((a, b) => b.length - a.length);


const tokenize = (code) => {
    const tokens = [];
    let currentState = TOKENIZER_STATE.DEFAULT;
    let currentCommentType = null;
    let currentStringDelimiter = null;
    let currentToken = '';
    for (let i = 0; i < code.length; i++) {
        const currentCharacter = code[i];
        const nextCharacter = code[i + 1] || '';

        switch (currentState) {
            case TOKENIZER_STATE.DEFAULT:
                if (isCurrentCharacterAWordStart(currentCharacter)) {
                    currentToken += currentCharacter;
                    currentState = TOKENIZER_STATE.IN_WORD;
                } else if (isCurrentCharacterANumber(currentCharacter)) {
                    currentToken += currentCharacter;
                    currentState = TOKENIZER_STATE.IN_NUMBER;
                } else if (isThisTheStartOfAComment(currentCharacter, nextCharacter)) {
                    currentToken += currentCharacter + nextCharacter;
                    currentCommentType = getCommentType(currentCharacter, nextCharacter);
                    i++; // skip the next character as it's part of the comment start
                    currentState = TOKENIZER_STATE.IN_COMMENT;
                } else if (isThisTheStartOfAString(currentCharacter)) {
                    currentToken += currentCharacter;
                    currentStringDelimiter = currentCharacter;
                    currentState = TOKENIZER_STATE.IN_STRING;
                } else if (currentCharacter === '\n') {
                    tokens.push({ type: TOKEN_TYPE.IS_NEWLINE, value: currentCharacter });
                } else if (isCurrentCharacterAWhiteSpace(currentCharacter)) {
                    tokens.push({ type: TOKEN_TYPE.WHITESPACE, value: currentCharacter });
                } else {
                    // check for operators
                    let operatorFound = false;
                    for (let operator of OPERATORS) {
                        if (code.startsWith(operator, i)) {
                            tokens.push({ type: TOKEN_TYPE.OPERATOR, value: operator });
                            i += operator.length - 1; // skip the operator characters
                            operatorFound = true;
                            break;
                        }
                    }
                    if (!operatorFound) {
                        tokens.push({ type: TOKEN_TYPE.PUNCTUATION, value: currentCharacter });
                    }
                }
                break;

            case TOKENIZER_STATE.IN_WORD:
                if (isCurrentCharacterAWordPart(currentCharacter) || isCurrentCharacterANumber(currentCharacter)) {
                    currentToken += currentCharacter;
                } else {
                    const tokenType = KEYWORDS.has(currentToken) ? TOKEN_TYPE.KEYWORD : TOKEN_TYPE.IDENTIFIER;
                    tokens.push({ type: tokenType, value: currentToken });
                    currentToken = '';
                    currentState = TOKENIZER_STATE.DEFAULT;
                    i--; // re-evaluate the current character in the default state
                }
                break;
            case TOKENIZER_STATE.IN_NUMBER:
                if (isCurrentCharacterANumber(currentCharacter)) {
                    currentToken += currentCharacter;
                } else {
                    tokens.push({ type: TOKEN_TYPE.NUMBER, value: currentToken });
                    currentToken = '';
                    currentState = TOKENIZER_STATE.DEFAULT;
                    i--; // re-evaluate the current character in the default state
                }
                break;

            case TOKENIZER_STATE.IN_COMMENT:
                if (isThisTheEndOfAComment(currentCommentType, currentCharacter, nextCharacter)) {
                    if (currentCommentType === COMMENT_TYPE.MULTI_LINE) {
                        currentToken += currentCharacter + nextCharacter;
                        i++; // skip the next character as it's part of the comment end
                    }
                    tokens.push({ type: TOKEN_TYPE.COMMENT, value: currentToken });
                    currentToken = '';
                    currentCommentType = null;
                    currentState = TOKENIZER_STATE.DEFAULT;
                    if (currentCharacter === '\n') {
                        i--; // re-evaluate newline so it can be tokenized and filtered separately
                    }
                } else {
                    currentToken += currentCharacter;
                }
                break;

            case TOKENIZER_STATE.IN_STRING:
                if (currentCharacter === currentStringDelimiter && !isEscapedStringDelimiter(code, i)) {
                    currentToken += currentCharacter;
                    tokens.push({ type: TOKEN_TYPE.STRING, value: currentToken });
                    currentToken = '';
                    currentStringDelimiter = null;
                    currentState = TOKENIZER_STATE.DEFAULT;
                } else {
                    currentToken += currentCharacter;
                }
                break;

            default:
                break;
        }
    }

    // Handle any remaining token at the end of the code - like an identifier or a number that wasn't followed by a non-word character
    if (currentToken) {
        const tokenType = KEYWORDS.has(currentToken) ? TOKEN_TYPE.KEYWORD : TOKEN_TYPE.IDENTIFIER;
        tokens.push({ type: tokenType, value: currentToken });
    }

    return tokens;
}


const filteredTokens = (tokens) => {
    return tokens.filter(token => token.type !== TOKEN_TYPE.COMMENT && token.type !== TOKEN_TYPE.WHITESPACE && token.type !== TOKEN_TYPE.IS_NEWLINE);
}

const WORD_LIKE = new Set(["KEYWORD", "IDENTIFIER", "NUMBER"]);

function isWordLikeToken(token) {
    return WORD_LIKE.has(token.type);
}

const constructMinifiedCodeFromTokens = (tokens) => {
    let minifiedCode = '';
    for (let i = 0; i < tokens.length; i++) {
        const currentToken = tokens[i];
        minifiedCode += currentToken.value;
        if (isWordLikeToken(currentToken) && i + 1 < tokens.length && isWordLikeToken(tokens[i + 1])) {
            minifiedCode += ' '; // add space between two word-like tokens
        }
    }
    return minifiedCode;
}



const minifyCode = (code) => {
    const tokenizedCode = tokenize(code);
    const filteredTokenizedCode = filteredTokens(tokenizedCode);
    return constructMinifiedCodeFromTokens(filteredTokenizedCode);
}


const minifyAndPrintCode = (code) => {
    const minifiedCode = minifyCode(code);
    const resultTextArea = document.getElementById('result_text_area');
    resultTextArea.value = minifiedCode;
}
