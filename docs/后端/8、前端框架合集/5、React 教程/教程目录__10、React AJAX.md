# 10、React AJAX
- 来源：https://ddkk.com/zhuanlan/qianduan/react/10.html
- 分类：前端框架
- 分组：教程目录
React 组件的数据可以通过 componentDidMount 方法中的 Ajax 来获取，当从服务端获取数据库可以将数据存储在 state 中，再用 this.setState 方法重新渲染 UI。

当使用异步加载数据时，在组件卸载前使用 componentWillUnmount 来取消未完成的请求。

> 以下代码使用 jQuery 完成 Ajax 请求。

## React Ajas 获取 Github 用户最新 gist 共享描述范例

```js
var UserGist = React.createClass({
  getInitialState: function() {
    return {
      username: '',
      lastGistUrl: ''
    };
  },
  componentDidMount: function() {
    this.serverRequest = $.get(this.props.source, function (result) {
      var lastGist = result[0];
      this.setState({
        username: lastGist.owner.login,
        lastGistUrl: lastGist.html_url
      });
    }.bind(this));
  },
  componentWillUnmount: function() {
    this.serverRequest.abort();
  },
  render: function() {
    return (
      <div>
        {this.state.username} 用户最新的 Gist 共享地址：
        <a href={this.state.lastGistUrl}>{this.state.lastGistUrl}</a>
      </div>
    );
  }
});
ReactDOM.render(
  <UserGist source="https://api.github.com/users/loganrichard/gists" />,
  document.getElementById('app')
);
```
