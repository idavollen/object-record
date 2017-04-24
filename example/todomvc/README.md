This modified todoMVC example is used to show how to alternatively realize time travelling with *object-record* with **_Redux_**

## Steps to run todoMVC example that use *object-record* to realize time travelling

1. build modified Redux that uses *object-record*

```
cd example/lib/redux
npm install 
npm run build
npm link
```

2. build todoMVC

```
cd ../todomvc
npm link redux
npm install 
npm run start
```

3. test time travelling
```
type http://localhost:3000/ in your browser

```

	You can first try to add some todo items and change status of some of them, and toggle filter. then you can try the **_Back_** button to backwards time-travel to old times, even back to the starting point, or click **_Forward_** to travel forward to until today.

## Open Source Code

Source code for this npm package is available [idavollen@github](https://github.com/idavollen/object-record)


Enjoy!

## License

MIT
