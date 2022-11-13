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
