import React from 'react'

export default ({ title, desc }: { title: string; desc: string }) => {
  return (
    <div className="info-page">
      <div className="panel panel-success center-block">
        <div className="panel-heading">
          <div className="title">{title}</div>
        </div>
        <div className="panel-body">
          <div className="desc">{desc}</div>
        </div>
      </div>
    </div>
  )
}
