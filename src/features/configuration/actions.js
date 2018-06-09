let actions = {
  submitConfiguration: (data) => {
    if (data.type == 'testnet'){
      window.ipcRenderer.send('bytomdInitNetwork','testnet')
    }else if(data.type == 'mainnet'){
      window.ipcRenderer.send('bytomdInitNetwork','mainnet')
    }else if(data.type == 'solonet'){
      window.ipcRenderer.send('bytomdInitNetwork','solonet')
    }
    return (dispatch) => (dispatch)
  }
}

export default actions
