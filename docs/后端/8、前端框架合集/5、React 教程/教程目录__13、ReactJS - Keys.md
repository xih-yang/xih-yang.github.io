# 13、ReactJS - Keys
- 来源：https://ddkk.com/zhuanlan/qianduan/react/13.html
- 分类：前端框架
- 分组：教程目录
**React** 是根据组件上设定的 **key** 属性来生成该组件唯一的标识，只有key改变了，React才会更新组件，否则重用该组件。如果想要更新组件内容，请保证每次的key都不一样

如果的组件是动态组件（需要动态更新），例如一个列表做展示时，能向列表添加或删除元素，此时组件是需要刷新的，刷新的依据就是key。

对于相同的key，React会采取和上一次刷新同样的方式。

> 对同一个元素，必须保证 key 唯一

## 组件的 Keys 使用范例

```js
<!doctype html>
<meta charset="utf-8">
<title>React Keys -DDKK.COM 弟弟快看，程序员编程资料站</title>
<script src="https://cdn.staticfile.org/react/15.5.4/react.min.js"></script>
<script src="https://cdn.staticfile.org/react/15.5.4/react-dom.min.js"></script>
<script src="https://cdn.staticfile.org/babel-standalone/6.24.0/babel.min.js"></script>
<div id="root"></div>
<script type="text/babel">
class App extends React.Component {
   constructor() {
      super();
      this.state = {
data: [
   {
      component: '首先...',
      id: 1
   },
   {
      component: '其次...',
      id: 2
   },
   {
      component: '再次...',
      id: 3
   },
   {
      component: '第八次...',
      id: 8
   }
]
      }
   }
   render() {
      return (
         <div>
            <div>
               {this.state.data.map((dynamicComponent, i) => <Content 
                  key = {i} componentData = {dynamicComponent}/>)}
            </div>
         </div>
      );
   }
}
class Content extends React.Component {
   render() {
      return (
         <div>
            <div>{this.props.componentData.component}</div>
            <div>{this.props.componentData.id}</div>
         </div>
      );
   }
}
ReactDOM.render(<App/>, document.getElementById('root'));
</script>
```

运行上面的应用我们会看到四组列表项  如果我们给列表添加或者删除一些项，React 会根据列表项的 **key** 的值来追踪该元素
