# 15、Minio 教程 - Minio WebUploader上传文件的高级用法之进度条显示、文件过滤、图片预览、图片压缩
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/15.html
- 分类：分布式存储
- 分组：教程目录
深入了解请参考[官网](http://fex.baidu.com/webuploader/)详细说明

### 进度条显示

使用进程文件上传时，进度条显示是一个常用的功能，而WebUploader组件也是支持的。

文件上传中，Web Uploader会对外派送uploadProgress事件，其中包含文件对象和该文件当前上传进度。

我们这里只需要在JS中添加以上事件就可以了。

```java
    // 文件上传过程中创建进度条实时显示。
    uploader.on('uploadProgress', function (file, percentage) {
        let $li = $('#' + file.id),
            $percent = $li.find('.progress .progress-bar');
        // 避免重复创建
        if (!$percent.length) {
            $percent = $('<div class="progress progress-striped active">' +
                '<div class="progress-bar" role="progressbar" style="width: 0%">' +
                '</div>' +
                '</div>').appendTo($li).find('.progress-bar');
        }
        $li.find('p.state').text('上传中(' + ((percentage * 100).toFixed(2) + '%') + ')');
        $percent.css('width', percentage * 100 + '%');
    });
```

注意，这里有一个坑，进度条的样式需要自己配置，所以要在webuploader.css文件中添加以下CSS样式。

```java
.progress {
	height: 20px;
	margin-bottom: 20px;
	overflow: hidden;
	background-color:f5f5f5;
	border-radius: 4px;
	-webkit-box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
	box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}
.progress.active .progress-bar {
	-webkit-animation: progress-bar-stripes 2s linear infinite;
	animation: progress-bar-stripes 2s linear infinite;
}
.progress-striped .progress-bar {
	background-image: linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent);
	background-size: 40px 40px;
}
.progress-bar {
	background-image: -webkit-linear-gradient(top,#428bca 0,#3071a9 100%);
	background-image: linear-gradient(to bottom,#428bca 0,#3071a9 100%);
	background-repeat: repeat-x;
	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=’#ff428bca’,endColorstr=’#ff3071a9’,GradientType=0);
}
.progress-bar {
	float: left;
	height: 100%;
	font-size: 12px;
	line-height: 20px;
	color:fff;
	text-align: center;
	background-color:428bca;
	box-shadow: inset 0 -1px 0 rgba(0,0,0,0.15);
	transition: width .6s ease;
}
```

点击上传，进度条就成功显示了

### 文件过滤

文件过滤可以对添加的文件类型进行限制，比如只能上传图片，这也是一个常用的功能。

实际使用时，只需要在初始化uploader时，添加accept配置就可以了。比如以下代码表示，只能添加图片。

```java
    // 初始化Web Uploader
    const uploader = WebUploader.create({
        // swf文件路径
        swf: 'static/Uploader.swf',
        server: '/minio/upload',// 文件接收服务端。
        pick: '#picker',// 选择文件的按钮。可选。内部根据当前运行是创建，可能是input元素，也可能是flash. 这里是div的id
        method: 'POST', // 文件上传方式，POST或者GET，默认Post
        resize: false,// 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
        // 只允许选择图片文件。
        accept: {
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    });
```

点击选择文件，发现只能选择图片类型。就算选择到了非图片类型，也无法添加到上传队列中。

### 图片预览

WebUploader支持在添加图片后，展示预览图。监听fileQueued事件，通过uploader.makeThumb来创建图片预览图。 注意这里得到的是Data URL数据，IE6、IE7不支持直接预览。可以借助FLASH或者服务端来完成预览。

这里我们添加一个fileQueued事件。

```java
    // 当有文件添加进来的时候
    uploader.on('fileQueued', function (file) {
        // 缩略图大小
        var ratio = window.devicePixelRatio || 1;
        var thumbnailWidth = 100 * ratio;
        var thumbnailHeight = 100 * ratio;
        var $ = jQuery;
        var $list = $('#list');
        var $li = $(
            '<div id="' + file.id + '" class="file-item thumbnail">' +
            '<img>' +
            '<div class="info">' + file.name + '</div>' +
            '</div>'
            ),
            $img = $li.find('img');
        // $list为容器jQuery实例
        $list.append($li);
        // 创建缩略图
        // 如果为非图片文件，可以不用调用此方法。
        // thumbnailWidth x thumbnailHeight 为 100 x 100
        uploader.makeThumb(file, function (error, src) {
            if (error) {
                $img.replaceWith('<span>不能预览</span>');
                return;
            }
            $img.attr('src', src);
        }, thumbnailWidth, thumbnailHeight);
    });
```

然后点击选择文件，预览图效果就出来了。

### 图片压缩

支持常用图片格式jpg,jpeg,gif,bmp,png预览与压缩，节省网络数据传输。

解析jpeg中的meta信息，对于各种orientation做了正确的处理，同时压缩后上传保留图片的所有原始meta数据。

只需要在初始化添加compress，配置压缩的图片的选项。如果此选项为false, 则图片在上传前不进行压缩。

比如以下代码表示对图片进行压缩。

```java
// 初始化Web Uploader
    const uploader = WebUploader.create({
        // swf文件路径
        swf: 'static/Uploader.swf',
        server: '/minio/upload',// 文件接收服务端。
        pick: '#picker',// 选择文件的按钮。可选。内部根据当前运行是创建，可能是input元素，也可能是flash. 这里是div的id
        method: 'POST', // 文件上传方式，POST或者GET，默认Post
        resize: false,// 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
        compress:
            {
                width: 100,
                height: 100,
                // 图片质量，只有type为image/jpeg的时候才有效。
                quality: 50,
                // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
                allowMagnify: false,
                // 是否允许裁剪。
                crop: false,
                // 是否保留头部meta信息。
                preserveHeaders: true,
                // 如果发现压缩后文件大小比原来还大，则使用原来图片
                // 此属性可能会影响图片自动纠正功能
                noCompressIfLarger: false,
                // 单位字节，如果图片大小小于此值，不会采用压缩。
                compressSize: 0
            }
    });
```

然后在页面上上传一个170K的文件：

然后登录Minio，发现图片被压缩到了2.4k。
