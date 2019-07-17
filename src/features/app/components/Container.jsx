import React from 'react'
import { connect } from 'react-redux'
import actions from 'actions'
import { Main, Config, Login, Loading, Modal } from './'
import moment from 'moment'
import { withI18n } from 'react-i18next'

const CORE_POLLING_TIME = 2 * 1000

class Container extends React.Component {
  constructor(props) {
    super(props)
    if(props.location.pathname.includes('index.html')) {
      this.redirectRoot(props)
    }
    this.redirectRoot = this.redirectRoot.bind(this)
  }

  redirectRoot(props) {
    const {
      authOk,
      configured,
      location,
      accountInit
    } = props

    if (!authOk) {
      return
    }

    if(!configured){
      this.props.showConfiguration()
    }else if(!accountInit){
      this.props.showInitialization()
    }else {
      if (location.pathname === '/' ||
        location.pathname.indexOf('configuration') >= 0 ||
        location.pathname.includes('index.html') ||
        location.pathname.indexOf('initialization') >= 0) {
        this.props.showRoot()
      }
    }
  }

  componentDidMount() {
    if(window.ipcRenderer){
      window.ipcRenderer.on('redirect', (event, arg) => {
        this.props.history.push(arg)
      })
      window.ipcRenderer.on('btmAmountUnitState', (event, arg) => {
        this.props.uptdateBtmAmountUnit(arg)
      })
      window.ipcRenderer.on('lang', (event, arg) => {
        this.props.i18n.changeLanguage(arg)
      })
      window.ipcRenderer.on('ConfiguredNetwork', (event, arg) => {
        if(arg === 'startNode'){
          this.props.fetchInfo().then(() => {
            this.props.fetchKeyItem().then(resp => {
              if (resp.data.length == 0) {
                this.setState({noAccountItem: true})
                this.props.showInitialization()
              }
            })
            this.props.showRoot()
          })
          setInterval(() => this.props.fetchInfo(), CORE_POLLING_TIME)
        }
        if(arg === 'init'){
          this.props.updateConfiguredStatus()
        }
      })
      window.ipcRenderer.on('mining', (event, arg) => {
        let isMining = (arg == 'true')
        this.props.updateMiningState(isMining)
      })
    }
    if(this.props.lng === 'zh'){
      moment.locale('zh-cn')
    }else{
      moment.locale(this.props.lng)
    }
  }

  componentWillMount() {
    this.props.fetchAccountItem().then(resp => {
      const promise = new Promise((resolve, reject) => {
        if (resp.data.length == 0) {
          this.props.switchAccount('')
          resolve()
        }else{
          const aliasArray = resp.data.map(account => account.alias)
          if(!aliasArray.includes(this.props.currentAccount) ){
            this.props.setDefaultAccount().then(()=>{
              resolve()
            })
          }else{
            resolve()
          }
        }
      })

      return promise.then(()=>{
        return this.props.fetchKeyItem().then(resp => {
          if (resp.data.length == 0) {
            this.props.updateAccountInit(false)
          }else{
            this.props.updateAccountInit(true)
          }
          return this.props.fetchInfo().then(() => {
            this.redirectRoot(this.props)
          })
        })
      })
    })

    setInterval(() => this.props.fetchInfo(), CORE_POLLING_TIME)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.accountInit != this.props.accountInit ||
        nextProps.configured != this.props.configured ||
        nextProps.location.pathname != this.props.location.pathname) {
      this.redirectRoot(nextProps)
    }

  }

  render() {
    let layout
    const { i18n, t } = this.props
    i18n.on('languageChanged', function(lng) {
      if(lng === 'zh'){
        moment.locale('zh-cn')
      }else{
        moment.locale(lng)
      }
    })

    if (!this.props.authOk) {
      layout = <Login/>
    } else if (!this.props.configured) {
      layout = <Config>{this.props.children}</Config>
    } else if (!this.props.configKnown) {
      return <Loading>{t('welcome.connect')}</Loading>
    } else if (!this.props.accountInit){
      layout = <Config>{this.props.children}</Config>
    } else{
      layout = <Main>{this.props.children}</Main>
    }

    return <div>
      {layout}
      <Modal />

      {/* For copyToClipboard(). TODO: move this some place cleaner. */}
      <input
        id='_copyInput'
        onChange={() => 'do nothing'}
        value='dummy'
        style={{display: 'none'}}
      />
    </div>
  }
}

export default connect(
  (state) => ({
    authOk: !state.core.requireClientToken || state.core.validToken,
    configKnown: state.core.configKnown,
    configured: state.core.configured,
    flashMessages: state.app.flashMessages,
    accountInit: state.core.accountInit,
    currentAccount: state.account.currentAccount
  }),
  (dispatch) => ({
    fetchInfo: options => dispatch(actions.core.fetchCoreInfo(options)),
    updateMiningState: param => dispatch(actions.core.updateMiningState(param)),
    showRoot: () => dispatch(actions.app.showRoot),
    showConfiguration: () => dispatch(actions.app.showConfiguration()),
    uptdateBtmAmountUnit: (param) => dispatch(actions.core.updateBTMAmountUnit(param)),
    updateConfiguredStatus: () => dispatch(actions.core.updateConfiguredStatus),
    showInitialization: () => dispatch(actions.app.showInitialization()),
    updateAccountInit: (param) => dispatch(actions.app.updateAccountInit(param)),
    fetchKeyItem: () => dispatch(actions.key.fetchItems()),
    fetchAccountItem: () => dispatch(actions.account.fetchItems()),
    setDefaultAccount:() => dispatch(actions.account.setDefaultAccount()),
    switchAccount:(alias) => dispatch(actions.account.switchAccount(alias))
  })
)( withI18n() (Container) )
