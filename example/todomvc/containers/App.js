import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Header from '../components/Header'
import MainSection from '../components/MainSection'
import * as TodoActions from '../actions'

class App extends Component {
  render() {
    const { todos, actions, travel } = this.props
    console.log('container App travel:', travel)
    return (
      <div>
        <Header addTodo={actions.addTodo} />
        <MainSection todos={todos} actions={actions} />

        <div className="redux-state-travel-time">
          <button className="left" onClick={ e => travel(-1) }> Back </button>     
          <button className="right" onClick={ e => travel(1) }> Forward </button>
        </div>
      </div>
    )
  }
}

const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'SHOW_ALL':
      return todos
    case 'SHOW_COMPLETED':
      return todos.filter(t => t.completed)
    case 'SHOW_ACTIVE':
      return todos.filter(t => !t.completed)
  }
}

const mapStateToProps = (state) => {
  return {
    todos: getVisibleTodos(state.todos, state.visibilityFilter)
  }
}

App.propTypes = {
  todos: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired
}

/*function mapStateToProps(state) {
  return {
    todos: state.todos
  }
}*/

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(TodoActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
