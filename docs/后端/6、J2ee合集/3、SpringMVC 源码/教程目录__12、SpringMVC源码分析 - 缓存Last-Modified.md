# 12、SpringMVC源码分析 - 缓存Last-Modified
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/12.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

本文分析常用的@Controller中方法中实现Last-Modified的功能

## 一、引入

```java
RequestMappingHandlerAdapter.java
	/**
	 * This implementation always returns -1. An {@code @RequestMapping} method can
	 * calculate the lastModified value, call {@link WebRequest#checkNotModified(long)},
	 * and return {@code null} if the result of that call is {@code true}.
	 */
	@Override
	protected long getLastModifiedInternal(HttpServletRequest request, HandlerMethod handlerMethod) {
		return -1;
	}
```

从注释可以看出，RequestMappingHandlerAdapter的获取最后修改时间方法返回值是-1，即默认没有实现lastModified的功能；要想实现lastModified 缓存功能 ，@RequestMapping 方法可以通过WebRequest#checkNotModified(long)方法计算最后修改时间，如果请求的资源没有修改，则目标方法返回null值即可。

## 二、使用

定义一个@GetMapping方法，并调用WebRequest#checkNotModified(long)方法，即可实现Last-Modified的功能。

```java
	private long lastModified = System.currentTimeMillis();
	@GetMapping(value = "/checkNotModified", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity checkNotModified(WebRequest request) {
        if (request.checkNotModified(lastModified)) {
            System.out.println("lastModified : " + lastModified);
            return null;
        }
        return new ResponseEntity();
    }
```

## 三、原理分析

从WebRequest#checkNotModified(long)方法开始

1、checkNotModified( )

```java
ServletWebRequest.java
public boolean checkNotModified(long lastModifiedTimestamp) {
		return checkNotModified(null, lastModifiedTimestamp);
	}
```

```java
public boolean checkNotModified(@Nullable String etag, long lastModifiedTimestamp) {
		HttpServletResponse response = getResponse();
		if (this.notModified || (response != null && HttpStatus.OK.value() != response.getStatus())) {
			return this.notModified;
		}
		// Evaluate conditions in order of precedence.
		// See https://tools.ietf.org/html/rfc7232#section-6
		//检测If-Unmodified-Since，是否没有修改过
		if (validateIfUnmodifiedSince(lastModifiedTimestamp)) {
			if (this.notModified && response != null) {
				//设置412状态码
				response.setStatus(HttpStatus.PRECONDITION_FAILED.value());
			}
			return this.notModified;
		}
		//检测If-None-Match
		boolean validated = validateIfNoneMatch(etag);
		if (!validated) {
			//检测If-Modified-Since，是否修改过
			validateIfModifiedSince(lastModifiedTimestamp);
		}
		// Update response
		if (response != null) {
			boolean isHttpGetOrHead = SAFE_METHODS.contains(getRequest().getMethod());
			if (this.notModified) {
				//没有修改过，并且是get或head请求，设置状态码304
				response.setStatus(isHttpGetOrHead ?
						HttpStatus.NOT_MODIFIED.value() : HttpStatus.PRECONDITION_FAILED.value());
			}
			if (isHttpGetOrHead) {
				if (lastModifiedTimestamp > 0 && parseDateValue(response.getHeader(HttpHeaders.LAST_MODIFIED)) == -1) {
					//设置Last-Modified为最后修改时间lastModifiedTimestamp
					response.setDateHeader(HttpHeaders.LAST_MODIFIED, lastModifiedTimestamp);
				}
				if (StringUtils.hasLength(etag) && response.getHeader(HttpHeaders.ETAG) == null) {
					//设置Etag
					response.setHeader(HttpHeaders.ETAG, padEtagIfNecessary(etag));
				}
			}
		}
		return this.notModified;
	}
```

2、validateIfUnmodifiedSince( )

```java
private boolean validateIfUnmodifiedSince(long lastModifiedTimestamp) {
		if (lastModifiedTimestamp < 0) {
			return false;
		}
		//解析出If-Unmodified-Since
		long ifUnmodifiedSince = parseDateHeader(HttpHeaders.IF_UNMODIFIED_SINCE);
		if (ifUnmodifiedSince == -1) {
			return false;
		}
		// We will perform this validation...
		//notModified 为true时，表明被修改过，响应中设置412状态码
		//notModified 为false时，表明没有被修改过
		this.notModified = (ifUnmodifiedSince < (lastModifiedTimestamp / 1000 * 1000));
		return true;
	}
```

3、validateIfModifiedSince( )

```java
private boolean validateIfModifiedSince(long lastModifiedTimestamp) {
		if (lastModifiedTimestamp < 0) {
			return false;
		}
		//解析出If-Modified-Since
		long ifModifiedSince = parseDateHeader(HttpHeaders.IF_MODIFIED_SINCE);
		if (ifModifiedSince == -1) {
			return false;
		}
		// We will perform this validation...
		//notModified 为true时，表明没有被修改过，响应中设置403状态码
		//notModified 为false时，表明被修改过
		this.notModified = ifModifiedSince >= (lastModifiedTimestamp / 1000 * 1000);
		return true;
	}
```

## 总结：

Last-Modified存在的问题：

**1、** lastModifiedTimestamp/1000*1000，可以看出资源在1秒之内发生变化时，系统可能察觉不出来；

**2、** 文件周期生成，内容没有发生变化时，请求时系统会重新获取资源；
