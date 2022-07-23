import React from 'react'

export default ({ title, desc }: { title: string; desc: string }) => {
  return (
    <div className="info-page">
      <div className="title">{title}</div>
      <div className="desc">{desc}</div>
    </div>
  )
}
