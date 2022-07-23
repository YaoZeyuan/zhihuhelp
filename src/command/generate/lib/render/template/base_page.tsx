import React from 'react'
export default ({
  title,
  contentElementList = [],
}: {
  title: string
  contentElementList: React.ReactElement<any>[]
}) => {
  return (
    //@ts-ignore
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <link rel="stylesheet" type="text/css" href="../css/normalize.css" />
        <link rel="stylesheet" type="text/css" href="../css/markdown.css" />
        <link rel="stylesheet" type="text/css" href="../css/customer.css" />
        <link rel="stylesheet" type="text/css" href="../css/bootstrap.css" />
      </head>
      <body>{contentElementList}</body>
    </html>
  )
}
