import { reduxForm } from 'redux-form'
import { ErrorBanner, SubmitIndicator } from 'features/shared/components'
import pick from 'lodash/pick'
import actions from 'actions'
import React from 'react'
import styles from './Index.scss'

class Index extends React.Component {
  constructor(props) {
    super(props)

    this.submitWithValidation = this.submitWithValidation.bind(this)
  }

  submitWithValidation(data) {
    return new Promise((resolve, reject) => {
      this.props.submitForm(data)
        .catch((err) => reject({type: err}))
    })
  }

  render() {
    const {
      fields: {
        type
      },
      handleSubmit,
      submitting
    } = this.props

    const typeChange = (event) => {
      type.onChange(event).value
    }

    const typeProps = {
      ...pick(type, ['name', 'value', 'checked', 'onBlur', 'onFocus']),
      onChange: typeChange
    }

    let configSubmit = [
      (type.error && <ErrorBanner
        key='configError'
        title='There was a problem configuring your core'
        error={type.error}
      />),
      <button
        key='configSubmit'
        type='submit'
        className={`btn btn-primary btn-lg ${styles.submit}`}
        disabled={ !type.value || submitting}>
          &nbsp;{'Join'} network
      </button>
    ]

    if (submitting) {
      configSubmit.push(<SubmitIndicator
        text={'Joining network...'}
      />)
    }

    return (
      <form  onSubmit={handleSubmit(this.submitWithValidation)} >
        <h2 className={styles.title}>Configure Bytom Core</h2>

        <div className={styles.choices}>

          <div className={styles.choice_wrapper}>
            <label>
              <input className={styles.choice_radio_button}
                    type='radio'
                    {...typeProps}
                    value='mainnet' />
              <div className={`${styles.choice} ${styles.join}`}>
                <span className={styles.choice_title}>Join the Bytom Main Net</span>

                <p>
                  Connect this Bytom Core to the Bytom MainNet.
                </p>
              </div>
            </label>
          </div>

          <div className={styles.choice_wrapper}>
            <label>
              <input className={styles.choice_radio_button}
                    type='radio'
                    {...typeProps}
                    value='testnet' />
              <div className={`${styles.choice} ${styles.testnet}`}>
                  <span className={styles.choice_title}>Join the Bytom Testnet</span>

                  <p>
                    Connect this Bytom Core to the Bytom Testnet.
                  </p>
              </div>
            </label>
          </div>
        </div>

        {type.value &&<div className={`${styles.choices} ${styles.flexCenter}`}>
          <div> {configSubmit} </div>
        </div>}
       </form>
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  submitForm: (data) => dispatch(actions.configuration.submitConfiguration(data))
})

const config = {
  form: 'cotareConfigurationForm',
  fields: [
    'type'
  ]
}

export default reduxForm(
  config,
  mapDispatchToProps
)(Index)
