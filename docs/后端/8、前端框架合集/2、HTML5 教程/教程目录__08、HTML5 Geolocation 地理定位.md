# 08、HTML5 Geolocation 地理定位
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/8.html
- 分类：前端框架
- 分组：教程目录
HTML5 Geolocation（地理定位）用于定位用户的位置

## 定位用户的位置

HTML5 Geolocation API 用于获得用户的地理位置

鉴于该特性可能侵犯用户的隐私，除非用户同意，否则用户位置信息是不可用的

## 浏览器支持

Internet Explorer 9+, Firefox, Chrome, Safari 和 Opera 支持 Geolocation（地理定位）.

> Geolocation（地理定位）对于拥有 GPS 的设备，比如 iPhone，地理定位更加精确

## 使用地理定位

HTML DOM getCurrentPosition() 方法用来获得用户的位置

下面的范例演示了一个简单的的地理定位，返回用户位置的经度和纬度

```html
var x = document.getElementById("demo");
function getLocation()
{
    if (navigator.geolocation)  
    {
        navigator.geolocation.getCurrentPosition(showPosition);  
    } else {
        x.innerHTML="该浏览器不支持获取地理位置";  
    }
}
function showPosition(position)   
{
    x.innerHTML="纬度: " + position.coords.latitude + 
    "<br>经度: " + position.coords.longitude;      
}
```

检测浏览器是否支持地理定位

如果支持，则运行 getCurrentPosition() 方法

如果不支持，则向用户显示一段消息

如果getCurrentPosition() 运行成功，则向参数 showPosition 中规定的函数返回一个 coordinates 对象

showPosition() 函数获得并显示经度和纬度

> 注意： 这个范例是一个非常基础的地理定位脚本，不含错误处理

## 处理错误和拒绝

方法getCurrentPosition() 的第二个参数用于处理错误，规定了当获取用户位置失败时运行的函数

```html
function showError(error)
{
    switch(error.code) 
    {
        case error.PERMISSION_DENIED:
            x.innerHTML="用户拒绝对获取地理位置的请求。"
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML="位置信息是不可用的。"
            break;
        case error.TIMEOUT:
            x.innerHTML="请求用户地理位置超时。"
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML="未知错误。"
            break;
    }
}
```

### 错误代码

错误代码
描述

Permission denied
用户不允许地理定位

Position unavailable
无法获取当前位置

Timeout
操作超时

## 在地图中显示结果

如需在地图中显示结果，需要访问可使用经纬度的地图服务，比如谷歌地图或百度地图

```html
function showPosition(position)
{
    var latlon=position.coords.latitude+","+position.coords.longitude;
    var img_url="http://maps.googleapis.com/maps/api/staticmap?center="
    +latlon+"&zoom=14&size=400x300&sensor=false";
    document.getElementById("mapholder").innerHTML="<img src='"+img_url+"'>";
}
```

上面这个范例，我们我们使用返回的经纬度数据在谷歌地图中显示位置（使用静态图像）

Google 地图脚本

这个范例演示了如何使用脚本来显示带有标记、缩放和拖曳选项的交互式地图

## 给定位置的信息

本节大部分的范例是如何在地图上显示用户的位置

不过，地理定位对于给定位置的信息同样很有用处

范例

**1、** 更新本地信息；

**2、** 显示用户周围的兴趣点；

**3、** 交互式车载导航系统(GPS)；

## getCurrentPosition() 方法 - 返回数据

若成功，则 getCurrentPosition() 方法返回对象

始终会返回 latitude、longitude 以及 accuracy 属性

如果可用，则会返回下面的属性

属性
描述

coords.latitude
十进制数的纬度

coords.longitude
十进制数的经度

coords.accuracy
位置精度

coords.altitude
海拔，海平面以上以米计

coords.altitudeAccuracy
位置的海拔精度

coords.heading
方向，从正北开始以度计

coords.speed
速度，以米/每秒计

timestamp
响应的日期/时间

## Geolocation 对象 - 其它有趣的方法

方法
描述

watchPosition()
返回用户的当前位置，并继续返回用户移动时的更新位置

clearWatch()
停止 watchPosition() 方法

下面的范例演示仪了 watchPosition() 方法，你需要一台精确的 GPS 设备来测试该范例

```html
var x=document.getElementById("demo");
function getLocation()
{
    if (navigator.geolocation)
    {
        navigator.geolocation.watchPosition(showPosition);
    }
    else
    {
        x.innerHTML="该浏览器不支持获取地理位置。";
    }
}
function showPosition(position)
{
    x.innerHTML="纬度: " + position.coords.latitude + 
    "<br>经度: " + position.coords.longitude; 
}
```
