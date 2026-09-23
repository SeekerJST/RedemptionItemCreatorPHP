// Evaluates the attribute cost formulas stored in attributescale.AttributeFormula,
// e.g. "20+([N]-1)*[N]*5", where [N] is the attribute's rank.
//
// Replaces eval(): the formulas come from the database, so evaluating them as
// JavaScript would let a bad row run arbitrary code. This small parser only
// understands numbers, [N], + - * /, unary minus, and parentheses.

/**
 * @param {string} formula
 * @param {number} rank
 * @returns {number}
 * @throws {Error} if the formula isn't valid arithmetic
 */
export function evaluateFormula(formula, rank) {
    const tokens = tokenize(formula.replaceAll('[N]', `(${rank})`));
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function expression() {
        let value = term();
        while (peek() === '+' || peek() === '-') {
            value = next() === '+' ? value + term() : value - term();
        }
        return value;
    }

    function term() {
        let value = factor();
        while (peek() === '*' || peek() === '/') {
            value = next() === '*' ? value * factor() : value / factor();
        }
        return value;
    }

    function factor() {
        const token = next();
        if (token === '-') {
            return -factor();
        }
        if (token === '(') {
            const value = expression();
            if (next() !== ')') {
                throw new Error(`Missing ")" in formula "${formula}"`);
            }
            return value;
        }
        if (typeof token === 'number') {
            return token;
        }
        throw new Error(`Unexpected "${token ?? 'end of formula'}" in formula "${formula}"`);
    }

    const result = expression();
    if (pos !== tokens.length) {
        throw new Error(`Unexpected "${peek()}" in formula "${formula}"`);
    }
    return result;
}

function tokenize(source) {
    const text = source.trim();
    const tokens = [];
    const pattern = /\s*(?:(\d+(?:\.\d+)?)|([-+*/()]))/y;
    let match;
    while (pattern.lastIndex < text.length && (match = pattern.exec(text)) !== null) {
        tokens.push(match[1] !== undefined ? Number(match[1]) : match[2]);
    }
    if (text.slice(pattern.lastIndex).trim() !== '') {
        throw new Error(`Unexpected character in formula "${text}"`);
    }
    return tokens;
}
