# Minify JavaScript

A small, browser-based JavaScript minifier built from scratch: it **tokenizes** source text, **filters** removable tokens, then **reconstructs** a shorter string with careful spacing between tokens that would otherwise merge into invalid JavaScript.

There is no bundler or build step—open the HTML page and run it locally.

## Quick start

1. Clone or download this repository.
2. Open `index.html` in a modern browser (double-click, or serve the folder with any static server).
3. Paste JavaScript into the first textarea and click **Run Code**. The minified output appears in the second textarea.

## What it does today


| Step            | Role                                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tokenize**    | Walks the input with a small state machine and emits typed tokens (keywords, identifiers, numbers, strings, operators, punctuation, comments, whitespace, newlines).                                                          |
| **Filter**      | Drops `COMMENT`, `WHITESPACE`, and `IS_NEWLINE` tokens—roughly “remove comments and insignificant whitespace.”                                                                                                                |
| **Reconstruct** | Concatenates remaining tokens and inserts a **single space** only when two adjacent **word-like** tokens (`KEYWORD`, `IDENTIFIER`, `NUMBER`) would otherwise run together and change meaning (e.g. `const a`, `return true`). |


### Supported tokenizer behavior

- **States**: `DEFAULT`, `IN_WORD`, `IN_NUMBER`, `IN_COMMENT`, `IN_STRING` (see `TOKENIZER_STATE` in `index.js`).
- **Comments**: `//` to end of line; `/* … */` block comments.
- **Strings**: `"`, `'`, and ``` with escape awareness so embedded quotes after `\` do not end the string early.
- **Operators**: Matched **longest-first** (e.g. `===` before `==` before `=`) via a sorted operator list—same idea as “check more specific patterns before less specific ones” in the design notes.
- **Keywords**: A fixed set (e.g. `const`, `let`, `function`, `return`, …) is classified as `KEYWORD`; other words are `IDENTIFIER`.

### What it is not (yet)

This is an incremental minifier, not a production compressor. Notable gaps:

- No **rename shortening** for variables or functions.
- No **expression optimization** or dead-code elimination.
- **Numbers** are digit runs only (no `0x`, `1e6`, `1n`, separators, etc., unless they happen to tokenize usefully by accident).
- **Regular expressions** as literals are not modeled; `/` may be treated like punctuation in contexts where a regex literal is valid.
- **Automatic semicolon insertion (ASI)** is not implemented; newlines are removed as tokens, which can change behavior for code that relies on ASI.
- No **HTML, CSS, SVG, JSON, CSV**, etc.—only the JS pipeline above.

Treat output as **unsafe for arbitrary codebases** until those areas are addressed.

## Project layout

```
index.html   # Minimal UI: input textarea, Run button, output textarea
index.js     # Tokenizer, filter, reconstruction, and `minifyAndPrintCode`
```

## Design reference

### Minification in general

Broader minification often includes:

1. Removing whitespace and line breaks (where safe).
2. Shortening identifiers (mangling).
3. Stripping comments.
4. Optimizing expressions and removing unreachable code.

For **CSS**, tools like [Lightning CSS](https://lightningcss.dev/minification.html) document additional concerns (merging rules, folding values, etc.) that apply when this project grows beyond JavaScript.

### Pipeline (conceptual)

1. Treat editor content as a string (here: `textarea` value).
2. **Tokenize** with explicit states (comments consume until newline or `*/`; strings until a non-escaped closing delimiter).
3. **Filter** tokens (e.g. drop comments and whitespace).
4. **Emit** minified text with rules so adjacent tokens do not merge incorrectly.

Spacing intuition (implemented via “word-like” adjacency):


| Left                          | Right             | Need space?                                                               |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------- |
| Keyword / identifier / number | Same class        | Yes (e.g. `const a`, `a 5` edge cases)                                    |
| Identifier                    | Operator like `=` | No (`a=`)                                                                 |
| Semicolon                     | Keyword           | No (`;const` as contiguous punctuation + word is handled by token stream) |


The code centralizes this by only inserting spaces between consecutive `KEYWORD`, `IDENTIFIER`, and `NUMBER` tokens.

### Future UI (not built yet)

Ideas for a richer front end once the engine is stronger:

1. Show raw **tokens** after tokenization.
2. Show **filtered** tokens.
3. Show final **output string**.
4. Step-by-step controls (Next step).
5. **Bonus**: highlight regions removed (comments, whitespace) relative to the original source.

### Future engine scope

- Optional **identifier mangling** / renaming.
- Optional **preservation of JSDoc** (would require comment classification and policy).
- Stronger **lexer** for regex literals, template nesting, and numeric literals.
- Optional **format-aware** pipelines for HTML, CSS, SVG, XML, JSON, CSV as listed in the project notes.

## Contributing / hacking

All logic lives in `index.js`. A good first change is extending tests or a small fixture file—there is no test runner in-repo yet; adding one is optional.

## License

No license file is included; add one if you plan to distribute or accept contributions.