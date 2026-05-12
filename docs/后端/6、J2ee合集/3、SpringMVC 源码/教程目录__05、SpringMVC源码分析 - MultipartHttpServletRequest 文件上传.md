# 05、SpringMVC源码分析 - MultipartHttpServletRequest 文件上传
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/5.html
- 分类：J2EE框架
- 分组：教程目录
上传文件接口如：

```java
	@PostMapping("/uploadData")
    public ResponseEntity uploadData(@RequestBody MultipartFile file) throws Exception {
		......
	}
```

当访问上面接口时，请求会进入到DispatcherServlet的doService( )，再进入到doDispatch( )，首先会进行文件上传请求的处理

1、doDispatch( )

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpServletRequest processedRequest = request;
		HandlerExecutionChain mappedHandler = null;
		boolean multipartRequestParsed = false;
		WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
		try {
			ModelAndView mv = null;
			Exception dispatchException = null;
			try {
				//1、处理文件上传请求
				processedRequest = checkMultipart(request);
				//2、标记文件上传请求
				multipartRequestParsed = (processedRequest != request);
				// Determine handler for the current request.
				mappedHandler = getHandler(processedRequest);
				if (mappedHandler == null) {
					noHandlerFound(processedRequest, response);
					return;
				}
				// Determine handler adapter for the current request.
				HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
				// Process last-modified header, if supported by the handler.
				String method = request.getMethod();
				boolean isGet = HttpMethod.GET.matches(method);
				if (isGet || HttpMethod.HEAD.matches(method)) {
					long lastModified = ha.getLastModified(request, mappedHandler.getHandler());
					if (new ServletWebRequest(request, response).checkNotModified(lastModified) && isGet) {
						return;
					}
				}
				if (!mappedHandler.applyPreHandle(processedRequest, response)) {
					return;
				}
				// Actually invoke the handler.
				mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
				if (asyncManager.isConcurrentHandlingStarted()) {
					return;
				}
				applyDefaultViewName(processedRequest, mv);
				mappedHandler.applyPostHandle(processedRequest, response, mv);
			}
			catch (Exception ex) {
				dispatchException = ex;
			}
			catch (Throwable err) {
				// As of 4.3, we're processing Errors thrown from handler methods as well,
				// making them available for @ExceptionHandler methods and other scenarios.
				dispatchException = new NestedServletException("Handler dispatch failed", err);
			}
			processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
		}
		catch (Exception ex) {
			triggerAfterCompletion(processedRequest, response, mappedHandler, ex);
		}
		catch (Throwable err) {
			triggerAfterCompletion(processedRequest, response, mappedHandler,
					new NestedServletException("Handler processing failed", err));
		}
		finally {
			if (asyncManager.isConcurrentHandlingStarted()) {
				// Instead of postHandle and afterCompletion
				if (mappedHandler != null) {
					mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest, response);
				}
			}
			else {
				// Clean up any resources used by a multipart request.
				if (multipartRequestParsed) {
					//3、清理
					cleanupMultipart(processedRequest);
				}
			}
		}
	}
```

以上是请求处理的核心流程,首先会对文件上传请求进行处理，转换成StandardMultipartHttpServletRequest

2、checkMultipart( )

```java
protected HttpServletRequest checkMultipart(HttpServletRequest request) throws MultipartException {
		//multipartResolver 不为null，并且是Multipart请求
		if (this.multipartResolver != null && this.multipartResolver.isMultipart(request)) {
			//检查请求是否已经被解析成MultipartHttpServletRequest
			if (WebUtils.getNativeRequest(request, MultipartHttpServletRequest.class) != null) {
				if (DispatcherType.REQUEST.equals(request.getDispatcherType())) {
					logger.trace("Request already resolved to MultipartHttpServletRequest, e.g. by MultipartFilter");
				}
			}
			//检查文件上传异常
			else if (hasMultipartException(request)) {
				logger.debug("Multipart resolution previously failed for current request - " +
						"skipping re-resolution for undisturbed error rendering");
			}
			else {
				try {
					//解析Multipart
					return this.multipartResolver.resolveMultipart(request);
				}
				catch (MultipartException ex) {
					if (request.getAttribute(WebUtils.ERROR_EXCEPTION_ATTRIBUTE) != null) {
						logger.debug("Multipart resolution failed for error dispatch", ex);
						// Keep processing error dispatch with regular request handle below
					}
					else {
						throw ex;
							}
				}
			}
		}
		// If not returned before: return original request.
		return request;
	}
```

3、isMultipart( )

```java
@Override
	public boolean isMultipart(HttpServletRequest request) {
		// Same check as in Commons FileUpload...
		//必须是post请求
		if (!"post".equalsIgnoreCase(request.getMethod())) {
			return false;
		}
		//request headers中的Content-Type以multipart/ 开头
		return StringUtils.startsWithIgnoreCase(request.getContentType(), "multipart/");
	}
```

4、getNativeRequest( )

```java
public static <T> T getNativeRequest(ServletRequest request, @Nullable Class<T> requiredType) {
		if (requiredType != null) {
			//判断请求类型
			if (requiredType.isInstance(request)) {
				return (T) request;
			}
			else if (request instanceof ServletRequestWrapper) {
				//包装请求，获取被包装的请求，递归进行校验请求类型
				return getNativeRequest(((ServletRequestWrapper) request).getRequest(), requiredType);
			}
		}
		return null;
	}
```

5、hasMultipartException( )

```java
private boolean hasMultipartException(HttpServletRequest request) {
		Throwable error = (Throwable) 
		//public static final String ERROR_EXCEPTION_ATTRIBUTE = "javax.servlet.error.exception";
		request.getAttribute(WebUtils.ERROR_EXCEPTION_ATTRIBUTE);
		while (error != null) {
			if (error instanceof MultipartException) {
				return true;
			}
			error = error.getCause();
		}
		return false;
	}
```

6、resolveMultipart( )

```java
@Override
	public MultipartHttpServletRequest resolveMultipart(HttpServletRequest request) throws MultipartException {
		//创建StandardMultipartHttpServletRequest，并解析上传文件信息
		return new StandardMultipartHttpServletRequest(request, this.resolveLazily);
	}
```

7、StandardMultipartHttpServletRequest( )

```java
public StandardMultipartHttpServletRequest(HttpServletRequest request, boolean lazyParsing)
			throws MultipartException {
		super(request);
		//是否配置了延迟解析
		if (!lazyParsing) {
			parseRequest(request);
		}
	}
```

8、parseRequest( )

```java
private void parseRequest(HttpServletRequest request) {
		try {
			//获取文件Parts
			Collection<Part> parts = request.getParts();
			this.multipartParameterNames = new LinkedHashSet<>(parts.size());
			MultiValueMap<String, MultipartFile> files = new LinkedMultiValueMap<>(parts.size());
			for (Part part : parts) {
				//Content-Disposition 下载文件的一些标识
				String headerValue = part.getHeader(HttpHeaders.CONTENT_DISPOSITION);
				ContentDisposition disposition = ContentDisposition.parse(headerValue);
				String filename = disposition.getFilename();
				if (filename != null) {
					if (filename.startsWith("=?") && filename.endsWith("?=")) {
						filename = MimeDelegate.decode(filename);
					}
					//创建StandardMultipartFile
					files.add(part.getName(), new StandardMultipartFile(part, filename));
				}
				else {
					this.multipartParameterNames.add(part.getName());
				}
			}
```

9、getParts( )

```java
 @Override
    public Collection<Part> getParts() throws IOException, ServletException {
        verifyMultipartServlet();
        if (parts == null) {
            loadParts();
        }
        return parts;
    }
```

```java
private void loadParts() throws IOException, ServletException {
        final ServletRequestContext requestContext = exchange.getAttachment(ServletRequestContext.ATTACHMENT_KEY);
        if (parts == null) {
            final List<Part> parts = new ArrayList<>();
            //获取Content-Type
            String mimeType = exchange.getRequestHeaders().getFirst(Headers.CONTENT_TYPE);
            //是否以multipart/form-data开头
            if (mimeType != null && mimeType.startsWith(MultiPartParserDefinition.MULTIPART_FORM_DATA)) {
				//FormData,可以包含多个文件信息，支持多文件上传
                FormData formData = parseFormData();
                if(formData != null) {
                    for (final String namedPart : formData) {
                        for (FormData.FormValue part : formData.get(namedPart)) {
                            parts.add(new PartImpl(namedPart,
                                    part,
                                    requestContext.getOriginalServletPathMatch().getServletChain().getManagedServlet().getMultipartConfig(),
                                    servletContext, this));
                        }
                    }
                }
            } else {
                throw UndertowServletMessages.MESSAGES.notAMultiPartRequest();
            }
            this.parts = parts;
        }
    }
```

10、cleanupMultipart( )

请求处理结束后，释放资源

```java
public void cleanupMultipart(MultipartHttpServletRequest request) {
		if (!(request instanceof AbstractMultipartHttpServletRequest) ||
				((AbstractMultipartHttpServletRequest) request).isResolved()) {
			// To be on the safe side: explicitly delete the parts,
			// but only actual file parts (for Resin compatibility)
			try {
				for (Part part : request.getParts()) {
					if (request.getFile(part.getName()) != null) {
						//将临时文件删除
						part.delete();
					}
				}
			}
			catch (Throwable ex) {
				LogFactory.getLog(getClass()).warn("Failed to perform cleanup of multipart items", ex);
			}
		}
	}
```
