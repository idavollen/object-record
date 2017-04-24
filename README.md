Object-Record
=========================

A simple javascript lib that records changes of a javascript object in an effective way, making it possible to navigate among those changes


## Installation



```
npm install --save object-record
or
yarn add object-record
```


## Documentation

- [**_createObjectHistory_**] initialize an object recorder with an initial object as starting point of your object history together with some configurations, such as the history size, by default it's **_50_**
	```javascript
		let objHistory = createObjectHistory({
	      	obj: startObj,
			history: {
				count: 3
			}
    	})
    ```
    The returned value of *createObjectHistory* is a javascript object, consisting of functions for updating and navigating object history
	1. [*update(newObject, cause)*] this function should be called each time there happens a change to your object. 
		```javascript
			/*
			@newObj 	is the new object after a change
			@cause		is the optional reason why this change occurred.

			@return     the indexing of current item in history is updated as the newObj
			*/		
			update(newObj, cause) {

			}
        ```

	2. [*back()*] this function is used to backwards navigate from current object one in history. 
		```javascript
			/*
			@return     the indexing of current item in history is updated as the one before current one if possible
			*/		
			back() {

			}
        ```
    3. [*forward()*] this function is used to forward navigate from current object one in history.
		```javascript
			/*
			@return     the indexing of current item in history is updated as the one after current one if possible
			*/		
			forward() {

			}
        ```
	
	4. [*go(steps)*] this helper function is used to continuously navigate many steps from current object one in history.
		```javascript
			/*
			@steps		if steps > 0, forward navigate so many steps. Otherwise, backwards navigate so many steps
			@return     the indexing of current item in history is updated so many steps forward or backwards based on steps
			*/		
			go(steps) {

			}
        ```	
    5. [*current()*] this function is used to retrive the current object one in history.
		```javascript
			/*
			@return     the current object in history list, how many before it and how many after it
			*/		
			current() {

			}
        ```

## Implementation
The implementation of history list of object changes is written with spesical attention to effective memory usage. Therefore execept the starting object, no javascript object is directly stored in memory. In stead, we only store the difference between the current js object and the new one when *update(newObj, cause)* is being called. And those difference can be used to rebuild js object while navigating amoung object history

## User Case
A typical scenario for applying the object-record is an alternative implementation of time travling of Redux state. 

1.[**_History Updating_**] Each time *Redux dispatch* is called, the current state in store is updated by reducers, therefore we can call **_objHistory.update(currentState, action)_**. In this way, the entire state changes in store is recorded.
		```javascript
		function dispatch(action) {
			...
			try {
		      isDispatching = true
		      currentState = currentReducer(currentState, action)
		      objHistory.update(currentState, action)
		    } finally {
		      isDispatching = false
		    }
		    ...
		}
        ```

2.[**_Time travelling_**] Redux store exports an extra function called, **_travel_** to clients of Redux so that UI could be time travelling in state changes of application store:
```javascript
		...
		  function travel(nr) {
		    console.log('currentState = ', currentState)
		    let cs = objHistory.go(nr).cur.obj
		    console.log(`after going ${nr} steps, currentState = `, cs)
		    if (cs) {
		      currentState = cs
		      const listeners = currentListeners = nextListeners
		      for (let i = 0; i < listeners.length; i++) {
		        const listener = listeners[i]
		        listener()
		      }
		    }
		    
		  }

		...

		return {
		    *travel*,
		    dispatch,
		    subscribe,
		    getState,
		    replaceReducer,
		    [$$observable]: observable
		}
```


![Time Travelling in Redux with object-record](https://github.com/idavollen/object-record/blob/master/object-record.gif "Time Travelling in Redux with object-record")


## Open Source Code

Source code for this npm package is available [idavollen@github](https://github.com/idavollen/simple-form-validator)


Enjoy!

## License

MIT
