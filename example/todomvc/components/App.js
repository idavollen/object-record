import React from 'react'
import Footer from './Footer'
import AddTodo from '../containers/AddTodo'
import VisibleTodoList from '../containers/VisibleTodoList'

const App = ({travel}) => (
	<div>
    <AddTodo />
    <VisibleTodoList />
    <Footer />
    <div className="redux-state-travel-time">
			<button className="left" onClick={ e => travel(-1) }>Back</button>    	
			<button className="right" onClick={ e => travel(1) }>Forward</button>
		</div>
  </div>
)

export default App
