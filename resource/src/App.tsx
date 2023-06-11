import React, { Component } from 'react'
import logo from './zhihuhelp_logo_512x512.png'
import svg_logo_window from './static/windows.svg'
import svg_logo_mac from './static/mac.svg'
import { CSSTransition } from 'react-transition-group'
import axios from 'axios'
import './App.less'
import { List } from 'antd'

export default class Base extends Component {
  state = {
    showThankList: false,
    config: {
      downloadUrl: 'https://github.com/YaoZeyuan/zhihuhelp#%E8%BD%AF%E4%BB%B6%E4%B8%8B%E8%BD%BD',
      releaseAt: '2019年02月16日',
      releaseNote: '知乎助手1.0.0, 闪亮发布.',
      version: 1.1,
      detail: {
        windows: {
          version: 1.1,
          url: 'http://zhihuhelp.yaozeyuan.online/%E7%A8%B3%E9%83%A8%E8%90%BD%20Setup%201.1.0.exe',
        },
        mac: { version: 1.1, url: 'http://zhihuhelp.yaozeyuan.online/%E7%A8%B3%E9%83%A8%E8%90%BD-1.1.0.dmg' },
      },
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
            <p className="tip" onClick={this.toggleThankList}>
              致谢列表
            </p>
            <a className="tip" href="https://github.com/YaoZeyuan/zhihuhelp/issues" target="_blank">
              功能建议
            </a>
          </div>
          <CSSTransition in={this.state.showThankList} timeout={300} classNames="fade" unmountOnExit>
            <div className="thank-list">
              <List
                itemLayout="horizontal"
                dataSource={thankList}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <p>
                          {item.time} {item.reason}
                        </p>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </CSSTransition>
        </div>
        <a href="https://github.com/YaoZeyuan/zhihuhelp" className="fork-me-on-github" target="_blank">
          <img
            width="149px"
            height="149px"
            src="https://github.blog/wp-content/uploads/2008/12/forkme_right_green_007200.png?resize=149%2C149"
            alt="Fork me on GitHub"
          />
        </a>
      </div>
    )
  }
}
