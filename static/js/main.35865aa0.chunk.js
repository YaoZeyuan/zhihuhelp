(this["webpackJsonpstablog-site"]=this["webpackJsonpstablog-site"]||[]).push([[0],{19:function(e,t,a){e.exports=a.p+"static/media/stablog_logo_256x256.899da545.png"},20:function(e,t,a){e.exports=a.p+"static/media/windows.185acfd1.svg"},21:function(e,t,a){e.exports=a.p+"static/media/mac.7ca102d4.svg"},25:function(e,t,a){e.exports=a(52)},30:function(e,t,a){},49:function(e,t,a){},52:function(e,t,a){"use strict";a.r(t);var n=a(0),s=a.n(n),o=a(2),c=a.n(o),i=(a(30),a(3)),r=a.n(i),l=a(15),m=a(16),h=a(17),d=a(22),u=a(18),g=a(23),b=a(19),p=a.n(b),E=a(20),v=a.n(E),f=a(21),k=a.n(f),w=a(54),N=a(4),y=a.n(N),B=(a(49),function(e){function t(){var e,a;Object(m.a)(this,t);for(var n=arguments.length,s=new Array(n),o=0;o<n;o++)s[o]=arguments[o];return(a=Object(d.a)(this,(e=Object(u.a)(t)).call.apply(e,[this].concat(s)))).state={showThankList:!1,config:{downloadUrl:"https://github.com/YaoZeyuan/stablog#%E8%BD%AF%E4%BB%B6%E4%B8%8B%E8%BD%BD",releaseAt:"2019\u5e7410\u670822\u65e5",releaseNote:"\u7a33\u90e8\u843d1.1.0, \u95ea\u4eae\u53d1\u5e03.",version:1.1,detail:{windows:{version:1.1,url:"http://stablog.bookflaneur.cn/%E7%A8%B3%E9%83%A8%E8%90%BD%20Setup%201.1.0.exe"},mac:{version:1.1,url:"http://stablog.bookflaneur.cn/%E7%A8%B3%E9%83%A8%E8%90%BD-1.1.0.dmg"}}},thankList:[{reason:"*\u660e\u660e\u6350\u52a9\u4e8625\u5143",time:"2019-10-14 21:34"}]},a.toggleThankList=function(){a.setState({showThankList:!a.state.showThankList})},a}return Object(g.a)(t,e),Object(h.a)(t,[{key:"componentDidMount",value:function(){var e=Object(l.a)(r.a.mark((function e(){var t,a,n,s;return r.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,y.a.get("https://api.bookflaneur.cn/stablog/version");case 2:return t=e.sent,e.next=5,y.a.get("https://api.bookflaneur.cn/stablog/thank_you/list");case 5:a=e.sent,n=t.data,s=a.data,this.setState({config:n,thankList:s});case 9:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){var e=this.state,t=e.config,a=e.thankList,n=e.showThankList,o=[],c=0,i=!0,r=!1,l=void 0;try{for(var m,h=a[Symbol.iterator]();!(i=(m=h.next()).done);i=!0){var d=m.value,u=c,g=s.a.createElement("div",{key:u,className:"thank-list-item"},s.a.createElement("div",{className:"thank-list-item-time"},d.time),s.a.createElement("div",{className:"thank-list-item-reason"},d.reason));o.push(g),c++}}catch(b){r=!0,l=b}finally{try{i||null==h.return||h.return()}finally{if(r)throw l}}return console.log("showThankList =>",n),s.a.createElement("div",{className:"Home"},s.a.createElement("div",{className:"body"},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"title"},"\u7a33\u90e8\u843d"),s.a.createElement("div",{className:"slogan"},"\u4e13\u4e1a\u5907\u4efd\u5bfc\u51fa\u5fae\u535a\u8bb0\u5f55"),s.a.createElement("div",{className:"desc"},"\u5907\u4efd\u539f\u7406: "),s.a.createElement("div",{className:"desc"},"\u767b\u5f55\xa0",s.a.createElement("a",{href:"https://m.weibo.cn",target:"_blank"},"m.weibo.cn"),"\xa0\u540e, \u6a21\u62df\u6d4f\u89c8\u5668\u8bbf\u95ee, \u83b7\u53d6\u767b\u5f55\u7528\u6237\u53d1\u5e03\u7684\u6240\u6709\u5fae\u535a\u5e76\u5907\u4efd\u4e4b"),s.a.createElement("div",{className:"desc"},"\u6240\u4ee5, \u5373\u4f7f\u70b8\u53f7, \u53ea\u8981\u8fd8\u80fd\u767b\u5f55\xa0",s.a.createElement("a",{href:"https://m.weibo.cn",target:"_blank"},"m.weibo.cn"),"\xa0 \u5c31\u53ef\u4ee5\u5907\u4efd"),s.a.createElement("div",{className:"desc"}),s.a.createElement("div",{className:"desc"},"\u6700\u65b0\u7248\u672c\uff1av",t.version),s.a.createElement("div",{className:"logo"},s.a.createElement("img",{src:p.a})),s.a.createElement("div",{className:"download-container"},s.a.createElement("div",{className:"download-tip"},"\u4e0b\u8f7d"),s.a.createElement("div",{className:"action-line"},s.a.createElement("a",{className:"download-button",target:"_blank",href:t.detail.windows.url},s.a.createElement("img",{className:"download-button-icon",src:v.a}),"Windows\u7248"),s.a.createElement("a",{className:"download-button",target:"_blank",href:t.detail.mac.url},s.a.createElement("img",{className:"download-button-icon",src:k.a}),"Mac\u7248"))))),s.a.createElement("div",{className:"footer"},s.a.createElement("div",{className:"comment"},s.a.createElement("a",{className:"tip",href:"https://github.com/YaoZeyuan/stablog",target:"_blank"},"\u4f7f\u7528\u6307\u5357"),s.a.createElement("p",{className:"tip",onClick:this.toggleThankList},"\u81f4\u8c22\u5217\u8868"),s.a.createElement("a",{className:"tip",href:"https://github.com/YaoZeyuan/stablog/issues",target:"_blank"},"\u529f\u80fd\u5efa\u8bae")),s.a.createElement(w.a,{in:this.state.showThankList,timeout:300,classNames:"fade",unmountOnExit:!0},s.a.createElement("div",{className:"thank-list"},o))),s.a.createElement("a",{href:"https://github.com/YaoZeyuan/stablog",className:"fork-me-on-github",target:"_blank"},s.a.createElement("img",{width:"149px",height:"149px",src:"https://github.blog/wp-content/uploads/2008/12/forkme_right_green_007200.png?resize=149%2C149",alt:"Fork me on GitHub"})))}}]),t}(n.Component));Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));c.a.render(s.a.createElement(B,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))}},[[25,1,2]]]);
//# sourceMappingURL=main.35865aa0.chunk.js.map