# 15、SpringCloud+Security+Oauth2实现微服务授权 -前端登录实战
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/15.html
- 分类：安全框架
- 分组：教程目录
这一章节我们考虑对接一下前端页面的登录，我这里采用的是比较经典的架构“前后端分离”，前端是VUE+ElementUI实现

## 1.前端登录

### 1.1.方案分析

后端没什么说的，跟之前文章中一样，你需要搭建独立的认证中心，其他的微服务做为资源服务即可，对于前台登录首先少不了账号密码登录模式，所以我们的方案可以这样，前台直接封装请求向认证中心获取Token可以使用“password”模式，然后把Token存储到SessionStorage中，请求资源的时候给Header添加上Token即可.

### 1.2.前端获取Token

使用“password”模式请求Token，如下：

```java
var param = "username=zs&password=123&client_id=system&client_secret=123&grant_type=password";
//请求参数的内容格式为普通方式，否则默认使用JSON格式提交参数
var config={
    headers: {
     'Content-Type': 'application/x-www-form-urlencoded'}
};
this.$http.post("/auth/oauth/token",param,config).then(res=>{
    //获取到Token
    var token = res.data.access_token;
    var refresh_token = res.data.refresh_token;
    //把token存储起来
    sessionStorage.setItem("U-TOKEN",token);
    sessionStorage.setItem("R-TOKEN",refresh_token );
    sessionStorage.setItem("user",'{"username":"zs"}');
    //修改登录成功后跳转到首页
    this.$router.push({
      path: '/main' });
    this.logining = false;
    return;
}).catch(error => {
    this.$message.error(error.message);
    this.logining = false;
    return;
});
```

这里Content-Type 设置为 application/x-www-form-urlencode ，发送请求到认证中心获取Token,然后存储Token

当然您可以会觉得这样去带参数会暴露 client_secret 秘钥，那你可以稍作修改，就是做一个登陆接口，前台只带着用户名和密码去登陆，在登录接口中获取client_id和client_secret 加上参数中的用户名和密码组装成完整的URL使用HTTP调用认证中心的令牌获取接口获取令牌，然后返回给客户端，比如：

```java
 	var loginParams = {
      username: "zs", password: "123",clientId:"system"};
            //发起请求 http://localhost:1020/hrm/auth/auth/oauth/token?
     this.$http.post("/auth/login/accessToken",loginParams).then(res=>{
         //获取到Token
         var token = res.data.resultObj.access_token;
         var refresh_token = res.data.resultObj.refresh_token;
         //把token存储起来
         sessionStorage.setItem("U-TOKEN",token);
         sessionStorage.setItem("R-TOKEN",refresh_token);
         sessionStorage.setItem("user",'{"username":"zs"}');
         //修改登录成功后跳转到首页
         this.$router.push({
      path: '/main' });
         this.logining = false;
         return;
     }).catch(error => {
         this.$message.error(error.message);
         this.logining = false;
         return;
     });
```

后台登录代码

```java
 @Override
    public AjaxResult login(Login login) {
        ValidUtils.assertNotNull(login.getUsername(),"用户名不可为空");
        ValidUtils.assertNotNull(login.getPassword(),"密码不可为空");
        ValidUtils.assertNotNull(login.getClientId(),"clientId不可为空");
        //String urlAccessToken = "%s/oauth/token?username=%s&password=%S&client_id=%S&client_secret=%s&grant_type=password"
        //组装获取Token的Url
        String accessTokenUrl = String.format(AuthConstants.URL_ACCESS_TOKEN,
                oauthProperties.getAuthServerUrl(),	//获取令牌地址
                login.getUsername(),	//用户名
                login.getPassword(),	//密码
                login.getClientId(),	//客户端ID
                oauthProperties.getSecrectByClentId(login.getClientId()));	//秘钥
			//发送Http请求获取Token,返回给浏览器
              return  AjaxResult.me().setResultObj(HttpUtil.sendPost(accessTokenUrl));
```

### 1.3.请求头添加Token

使用Axios拦截器给请求头添加Token，如下：

```java
axios.interceptors.request.use(config => {
    //如果已经登录了,每次都把token作为一个请求头传递过程
    if (sessionStorage.getItem('U-TOKEN')) {
        // 让每个请求携带token--['X-Token']为自定义key 请根据实际情况自行修改
        config.headers['Authorization'] = "Bearer "+sessionStorage.getItem('U-TOKEN')
    }
    return config
}, error => {
    // Do something with request error
    Promise.reject(error)
})
```

这样一来，每次发送请求都会在请求头中携带Token了，请求到了网关层就会对Token进行校验

## 2.Token无感刷新

### 2.1.方案分析

如果Token过期怎么办？Token过期请求会失败出现401错误，

**1、** 解决方案一：可以通过Axios的后置拦截器拦截到401错误直接弹出窗口要求用户去登录，当然这种方式对用户体验不是很好；

**2、** 方案二：可以在服务器端比如zuul中做授权失败的处理器，发现是401异常就自动向认证中心发送Token刷新请求，然后把新的Token写回客户端(比如通过cookie)，接着重新转发失败的请求；

**3、** 方案三：可以在前端做文章，通通过Axios的后置拦截器拦截到401错误，然后同步发送刷新Token的请求重新得到Token,把Token重新存储到SessionStorage，然后重新转发失败的请求，请求头携带新的Token；

后面两种都可以实现Token无感刷新，第三种方案更适合前后端分离项目

## 2.2.后置拦截器

Axios响应拦截器拦截401异常

```java
axios.interceptors.response.use(config => {
    return config
},error => {
    if (error && error.response) {
        switch (error.response.status) {
            case 401: return doRequest(error);
        }
    }
    Promise.reject(error)
});
```

如果是401异常，说明Token过期了，同步发送刷新Token请求,刷新TokenURL是

```java
/auth/oauth/token?client_id=system&client_secret=123
&grant_type=refresh_token&refresh_token=刷新Token
```

刷新Token是需要带着上一次获取Token返回的refresh_token值，所以在登录成功后除了要保持Token还要保存refresh_token

刷新Token请求如下：

```java
async function doRequest (error) {
    try {
    	//刷新Token请求
        const data = await getNewToken();
        var token = data.data.access_token;
        var refresh_token = data.data.refresh_token;
        //重新设置Token
        sessionStorage.setItem("U-TOKEN",token);
        sessionStorage.setItem("R-TOKEN",refresh_token);
        console.log("刷新Token:"+token);
        //继续请求之前未完成的请求
        const res = await axios.request(error.config);
        return res;
    } catch(err) {
        alert("登录失效,请重新登录");
        sessionStorage.clear();
        router.replace({
      path:"/login" });
        return err;
    }
}
async function getNewToken() {
	//获取到保存的refresh_token值
    var refreshToken = sessionStorage.getItem('R-TOKEN');
    //这里要发送同步请求
    return await axios({
        url: '/auth/oauth/token?client_id=system&client_secret=123&grant_type=refresh_token&refresh_token='+refreshToken,
        method: 'post',
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        }
    })
}
```

同步方式获取到新的Token,重新存储到sessionStorage中,然后调用axios.request继续执行之前的请求，这一次请求头中带的就是新的Token

## 3.总结

到这里就结束了，这里介绍了两个内容，一个是使用“password”授权模式基于账号密码的登录，二个是基于前端的Token刷新，当然对于短信登录，邮件登录，三方登录肯定有所不一样，这里暂不讨论，希望文章对你有所帮助
