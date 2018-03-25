import { chainClient } from 'utility/environment'

let actions = {
  submitConfiguration: (data) => {
    if (data.type == 'testnet'){
      window.ipcRenderer.send('bytomdInitNetwork','testnet')
    }else if(data.type == 'mainnet'){
      window.ipcRenderer.send('bytomdInitNetwork','mainnet')
    }


    return (dispatch) => (dispatch)
  }

}

export default actions
