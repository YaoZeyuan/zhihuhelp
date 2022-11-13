const counter = document.getElementById('counter')

window.electronAPI.onUpdateCounter((event, value, id) => {
  console.log('run onUpdateCounter => ', { value, id })
  const oldValue = Number(counter.innerText)
  const newValue = oldValue + value
  counter.innerText = newValue
  event.sender.send('js-rpc-response', {
    id,
    value,
  })
})

// 只能通过这种方式执行js文件中的函数
// 参考: https://stackoverflow.com/questions/36324333/refused-to-execute-inline-event-handler-because-it-violates-csp-sandbox
document.getElementById('open-js-rpc-devtools').addEventListener('click', openRpcDevtools)
function openRpcDevtools() {
  let webviewEle = document.querySelector('webview#zhihuhelp-rpc')
  console.log('webviewEle => ', webviewEle)
  // @ts-ignore
  webviewEle.openDevTools()
  console.log('send success')
}
