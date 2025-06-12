const space = `
// Comments
function foo(a, b) {
  /* Block comment */
  const test = 'test'
  if (a > 10) {
    if (b > 20) {
      return a + b
    }

    return a - b
  }

  if (a < -10) {
    return a * b
  }

  return a / b
}
`

const space4 = `
// Comments
function foo(a, b) {
    /* Block comment */
    const test = 'test'
    if (a > 10) {
        if (b > 20) {
            return a + b
        }

        return a - b
    }

    if (a < -10) {
        return a * b
    }

    return a / b
}
`

const tab = `
// Comments
function foo(a, b) {
\t/* Block comment */
\tconst test = 'test'
\tif (a > 10) {
\t\tif (b > 20) {
\t\t\treturn a + b
\t\t}

\t\treturn a - b
\t}

\tif (a < -10) {
\t\treturn a * b
\t}

\treturn a / b
}
`

const tab4 = `
\t\t\t\tconst a = 1
\t\t\t\tconsole.log(a)
`

const almostSpace = `
// Comments
function foo(a, b) {
  /* Block comment */
  const test = 'test'
  if (a > 10) {
    if (b > 20) {
      return a + b
    }

    return a - b
  }

\tif (a < -10) {
    return a * b
\t}

\treturn a / b
}
`

const almostTab = `
// Comments
function foo(a, b) {
  /* Block comment */
  const test = 'test'
\tif (a > 10) {
\t\tif (b > 20) {
\t\t\treturn a + b
\t\t}

\t\treturn a - b
\t}

\tif (a < -10) {
    return a * b
\t}

\treturn a / b
}
`

const spaceFirst = `
  2 spaces
  2 spaces
\t1 tab
\t1 tab
`

const tabFirst = `
\t1 tab
\t1 tab
  2 spaces
  2 spaces
`

const moreSpace = `
\t1 tab
\t1 tab
  2 spaces
  2 spaces
  2 spaces
`

const singleSpace = `
/**
 *
 * Long
 * Multi-line
 * Single space
 * Comment
 *
 */

    4 spaces
    4 spaces
\t1 tab
`

const singleSpace2 = `
/**
 *
 * Long
 * Multi-line
 * Single space
 * Comment
 *
 */
`

const longRepeat = `
{
  "key1": "text",
  "key2": "text",
  "key3": "text",
  "key4": "text",
  "key5": "text",
  "key6": "text",
  "key7": "text",
  "key8": "text",
  "key9": "text",
  "key10": "text",
  "key11": "text",
  "key12": "text",
  "key13": "text",
  "key14": "text",
  "key15": "text",
  "key16": "text",
  "key17": "text",
  "key18": "text",
  "key19": "text",
  "key20": "text",
  "some1": {
    "key1": "text",
    "key2": "text",
    "key3": "text",
    "key4": "text",
    "key5": "text",
    "key6": "text",
    "key7": "text"
  },
  "some2": {
    "key1": "text",
    "key2": "text"
  }
}
`

export const fixtures = {
	space,
	space4,
	tab,
	tab4,
	almostSpace,
	almostTab,
	spaceFirst,
	tabFirst,
	moreSpace,
	singleSpace,
	singleSpace2,
	longRepeat,
}
