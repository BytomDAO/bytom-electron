let actions = {
  submitConfiguration: (data) => {
    if (data.type == 'testnet'){
      window.ipcRenderer.send('vapordInitNetwork','testnet')
    }else if(data.type == 'mainnet'){
      window.ipcRenderer.send('vapordInitNetwork','mainnet')
    }else if(data.type == 'solonet'){
      window.ipcRenderer.send('vapordInitNetwork','solonet')
    }
    return (dispatch) => (dispatch)
  }
}

export default actions
