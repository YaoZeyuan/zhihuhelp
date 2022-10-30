import React from 'react'
export default (props: { children?: React.ReactNode; title: string }) => {
  return (
    //@ts-ignore
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charSet="utf-8" />
        <title>{props.title}</title>
        <link rel="stylesheet" type="text/css" href="../css/normalize.css" />
        <link rel="stylesheet" type="text/css" href="../css/markdown.css" />
        <link rel="stylesheet" type="text/css" href="../css/customer.css" />
        <link rel="stylesheet" type="text/css" href="../css/bootstrap.css" />
      </head>
      <body>{props.children}</body>
    </html>
  )
}
