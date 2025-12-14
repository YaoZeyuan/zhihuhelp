import React, { Component } from 'react'
import logo from './static/zhihuhelp_logo_512x512.png'
import svg_logo_window from './static/windows.svg'
import svg_logo_mac from './static/mac.svg'
import axios from 'axios'
import './App.less'

export default class Base extends Component {
  state = {
    showThankList: false,
    config: {
      "downloadUrl": "https://www.yaozeyuan.online/zhihuhelp",
      "releaseAt": "2023年4月8日",
      "releaseNote": "知乎助手2.5.1版, 闪亮发布. Mac用户请解压7z包后, 将应用程序移至应用程序目录后再使用",
      "version": "2.5.1",
      "detail": {
        "windows": {
          "version": "2.5.1",
          "url": "https://wwtd.lanzout.com/i8K1C0sgswch"
        },
        "mac": {
          "version": "2.5.1",
          "url": "https://wwtd.lanzout.com/iH4420sgssvc"
        }
      }
    },
    thankList: [{ reason: '*明明打赏10元', time: '2019-02-16 21:34' }],
  }

  async componentDidMount() {
    let versionResponse = await axios.get('https://api.yaozeyuan.online/zhihuhelp/version')
    let thankListResponse = await axios.get('https://api.yaozeyuan.online/zhihuhelp/thank_you_list')
    let config = versionResponse.data
    let thankList = thankListResponse.data
    this.setState({
      config,
      thankList,
    })
  }

  toggleThankList = () => {
    this.setState({
      showThankList: !this.state.showThankList,
    })
  }

  render() {
    const { config, thankList, showThankList } = this.state
    let thankEleList = []
    let counter = 0
    for (let item of thankList) {
      let index = counter
      let itemEle = (
        <div key={index} className="thank-list-item">
          <div className="thank-list-item-time">{item.time}</div>
          <div className="thank-list-item-reason">{item.reason}</div>
        </div>
      )
      thankEleList.push(itemEle)
      counter++
    }
    console.log('showThankList =>', showThankList)
    return (
      <div className="Home">
        <div className="body">
          <div className="container">
            <div className="title">知乎助手</div>
            <div className="slogan">制作自己的epub</div>

            <div className="desc"></div>
            <div className="desc">最新版本：v{`${config.version}`.padEnd(3, '.0')}</div>
            <div className="logo">
              <img src={logo} />
            </div>
            <div className="download-container">
              <div className="download-tip">下载</div>
              <div className="action-line">
                <a className="download-button" target="_blank" href={config.detail.windows.url}>
                  <img className="download-button-icon" src={svg_logo_window} />
                  Windows版
                </a>
                <a className="download-button" target="_blank" href={config.detail.mac.url}>
                  <img className="download-button-icon" src={svg_logo_mac} />
                  Mac版
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="footer">
          <div className="comment">
            <a className="tip" href="https://github.com/YaoZeyuan/zhihuhelp" target="_blank">
              使用指南
            </a>
            <a className="tip" href="https://github.com/YaoZeyuan/zhihuhelp/issues" target="_blank">
              功能建议
            </a>
          </div>
        </div>
        <a href="https://github.com/YaoZeyuan/zhihuhelp" className="fork-me-on-github" target="_blank">
          <img
            width="149px"
            height="149px"
            src="https://cdn.jsdelivr.net/gh/YaoZeyuan/blog@master/source/static/img/fork_me_on_github_right_green.png"
            alt="Fork me on GitHub"
          />
        </a>
      </div>
    )
  }
}
