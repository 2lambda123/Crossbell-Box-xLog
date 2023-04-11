const {
  transformColorObjectOfDarkmode,
  generateCSSByVar,
} = require("./transform")

const fs = require("fs")
const path = require("path")

const [colorObject, cssVar, cssVarDark] = transformColorObjectOfDarkmode()

const normalCSS = generateCSSByVar(cssVar)
const darkCSS = generateCSSByVar(cssVarDark)

const cssString = `
:root {
${normalCSS}
}

html.dark {
${darkCSS}
}

html.light {
${normalCSS}
}

@media (prefers-color-scheme: dark) {
  html:not(.dark):not(.light) {
  ${darkCSS}
  }
}

@media (prefers-color-scheme: light) {
  html:not(.dark):not(.light) {
  ${normalCSS}
  }
}
`

fs.writeFileSync(
  path.resolve(__dirname, "../../src/css/css-var.css"),
  cssString,
  {
    encoding: "utf-8",
  },
)

fs.writeFileSync(
  path.resolve(__dirname, "../../tw-colors.js"),
  `export default ${JSON.stringify(colorObject, null, 2)}`,
  {
    encoding: "utf-8",
  },
)
