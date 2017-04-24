import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import todoApp from './reducers'
//import App from './components/App'
import App from './containers/App'
import 'todomvc-app-css/index.css'
import './travel.css'

let store = createStore(todoApp)

render(
  <Provider store={store}>
    <App travel={ store.travel } />
  </Provider>,
  document.getElementById('root')
)
