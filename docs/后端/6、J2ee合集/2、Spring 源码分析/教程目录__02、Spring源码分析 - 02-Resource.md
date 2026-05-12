# 02、Spring源码分析 - 02-Resource
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/2.html
- 分类：J2EE框架
- 分组：教程目录
Spring的Resource接口为资源访问提供了统一的接口，不同的实现类实现了从不同上下文获取资源。下面是该接口的方法:

```java
public interface Resource extends InputStreamSource {
	boolean exists();
	default boolean isReadable() {
		return true;
	}
	default boolean isOpen() {
		return false;
	}
	default boolean isFile() {
		return false;
	}
	URL getURL() throws IOException;
	URI getURI() throws IOException;
	File getFile() throws IOException;
	default ReadableByteChannel readableChannel() throws IOException {
		return Channels.newChannel(getInputStream());
	}
	long contentLength() throws IOException;
	long lastModified() throws IOException;
	Resource createRelative(String relativePath) throws IOException;
	@Nullable
	String getFilename();
	String getDescription();
}
```

```java
public interface InputStreamSource {
    InputStream getInputStream() throws IOException;
}
```

下面分析几个常用的Resource实现类。

**1、** AbstractResource提供了Resource的默认实现；

```java
public abstract class AbstractResource implements Resource {
   @Override
   public boolean exists() {
      try {
         return getFile().exists();
      }
      catch (IOException ex) {
         try {
            InputStream is = getInputStream();
            is.close();
            return true;
         }
         catch (Throwable isEx) {
            return false;
         }
      }
   }
   @Override
   public boolean isReadable() {
      return true;
   }
   @Override
   public boolean isOpen() {
      return false;
   }
   @Override
   public boolean isFile() {
      return false;
   }
   @Override
   public URL getURL() throws IOException {
      throw new FileNotFoundException(getDescription() + " cannot be resolved to URL");
   }
   @Override
   public URI getURI() throws IOException {
      URL url = getURL();
      try {
         return ResourceUtils.toURI(url);
      }
      catch (URISyntaxException ex) {
         throw new NestedIOException("Invalid URI [" + url + "]", ex);
      }
   }
   @Override
   public File getFile() throws IOException {
      throw new FileNotFoundException(getDescription() + " cannot be resolved to absolute file path");
   }
   @Override
   public ReadableByteChannel readableChannel() throws IOException {
      return Channels.newChannel(getInputStream());
   }
   @Override
   public long contentLength() throws IOException {
      InputStream is = getInputStream();
      try {
         long size = 0;
         byte[] buf = new byte[255];
         int read;
         while ((read = is.read(buf)) != -1) {
            size += read;
         }
         return size;
      }
      finally {
         try {
            is.close();
         }
         catch (IOException ex) {
         }
      }
   }
   @Override
   public long lastModified() throws IOException {
      long lastModified = getFileForLastModifiedCheck().lastModified();
      if (lastModified == 0L) {
         throw new FileNotFoundException(getDescription() +
               " cannot be resolved in the file system for resolving its last-modified timestamp");
      }
      return lastModified;
   }
   protected File getFileForLastModifiedCheck() throws IOException {
      return getFile();
   }
   @Override
   public Resource createRelative(String relativePath) throws IOException {
      throw new FileNotFoundException("Cannot create a relative resource for " + getDescription());
   }
   @Override
   @Nullable
   public String getFilename() {
      return null;
   }
   @Override
   public String toString() {
      return getDescription();
   }
   @Override
   public boolean equals(Object obj) {
      return (obj == this ||
         (obj instanceof Resource && ((Resource) obj).getDescription().equals(getDescription())));
   }
   @Override
   public int hashCode() {
      return getDescription().hashCode();
   }
}
```

**2、** UrlResource封装了一个java.net.URL对象，用来访问URL可以正常访问的任意对象，比如文件；

```java
public class UrlResource extends AbstractFileResolvingResource {
   @Nullable
   private final URI uri;
   private final URL url;
   private final URL cleanedUrl;
   public UrlResource(URI uri) throws MalformedURLException {
      Assert.notNull(uri, "URI must not be null");
      this.uri = uri;
      this.url = uri.toURL();
      this.cleanedUrl = getCleanedUrl(this.url, uri.toString());
   }
   public UrlResource(URL url) {
      Assert.notNull(url, "URL must not be null");
      this.url = url;
      this.cleanedUrl = getCleanedUrl(this.url, url.toString());
      this.uri = null;
   }
   public UrlResource(String path) throws MalformedURLException {
      Assert.notNull(path, "Path must not be null");
      this.uri = null;
      this.url = new URL(path);
      this.cleanedUrl = getCleanedUrl(this.url, path);
   }
   public UrlResource(String protocol, String location) throws MalformedURLException  {
      this(protocol, location, null);
   }
   public UrlResource(String protocol, String location, @Nullable String fragment) throws MalformedURLException  {
      try {
         this.uri = new URI(protocol, location, fragment);
         this.url = this.uri.toURL();
         this.cleanedUrl = getCleanedUrl(this.url, this.uri.toString());
      }
      catch (URISyntaxException ex) {
         MalformedURLException exToThrow = new MalformedURLException(ex.getMessage());
         exToThrow.initCause(ex);
         throw exToThrow;
      }
   }
   private URL getCleanedUrl(URL originalUrl, String originalPath) {
      try {
         return new URL(StringUtils.cleanPath(originalPath));
      }
      catch (MalformedURLException ex) {
         // Cleaned URL path cannot be converted to URL
         // -> take original URL.
         return originalUrl;
      }
   }
   @Override
   public InputStream getInputStream() throws IOException {
      URLConnection con = this.url.openConnection();
      ResourceUtils.useCachesIfNecessary(con);
      try {
         return con.getInputStream();
      }
      catch (IOException ex) {
         // Close the HTTP connection (if applicable).
         if (con instanceof HttpURLConnection) {
            ((HttpURLConnection) con).disconnect();
         }
         throw ex;
      }
   }
   @Override
   public URL getURL() {
      return this.url;
   }
   @Override
   public URI getURI() throws IOException {
      if (this.uri != null) {
         return this.uri;
      }
      else {
         return super.getURI();
      }
   }
   @Override
   public boolean isFile() {
      if (this.uri != null) {
         return super.isFile(this.uri);
      }
      else {
         return super.isFile();
      }
   }
   @Override
   public File getFile() throws IOException {
      if (this.uri != null) {
         return super.getFile(this.uri);
      }
      else {
         return super.getFile();
      }
   }
   @Override
   public Resource createRelative(String relativePath) throws MalformedURLException {
      if (relativePath.startsWith("/")) {
         relativePath = relativePath.substring(1);
      }
      return new UrlResource(new URL(this.url, relativePath));
   }
   @Override
   public String getFilename() {
      return StringUtils.getFilename(this.cleanedUrl.getPath());
   }
   @Override
   public String getDescription() {
      return "URL [" + this.url + "]";
   }
   @Override
   public boolean equals(Object obj) {
      return (obj == this ||
         (obj instanceof UrlResource && this.cleanedUrl.equals(((UrlResource) obj).cleanedUrl)));
   }
   @Override
   public int hashCode() {
      return this.cleanedUrl.hashCode();
   }
}
```

**3、** 可以使用ClassPathResource来获取类路径上的资源ClassPathResource可以使用线程上下文的加载器、调用者提供的加载器或指定的类中的任意一个来加载资源；

```java
public class ClassPathResource extends AbstractFileResolvingResource {
   private final String path;
   @Nullable
   private ClassLoader classLoader;
   @Nullable
   private Class<?> clazz;
   public ClassPathResource(String path) {
      this(path, (ClassLoader) null);
   }
   public ClassPathResource(String path, @Nullable ClassLoader classLoader) {
      Assert.notNull(path, "Path must not be null");
      String pathToUse = StringUtils.cleanPath(path);
      if (pathToUse.startsWith("/")) {
         pathToUse = pathToUse.substring(1);
      }
      this.path = pathToUse;
      this.classLoader = (classLoader != null ? classLoader : ClassUtils.getDefaultClassLoader());
   }
   public ClassPathResource(String path, @Nullable Class<?> clazz) {
      Assert.notNull(path, "Path must not be null");
      this.path = StringUtils.cleanPath(path);
      this.clazz = clazz;
   }
   @Deprecated
   protected ClassPathResource(String path, @Nullable ClassLoader classLoader, @Nullable Class<?> clazz) {
      this.path = StringUtils.cleanPath(path);
      this.classLoader = classLoader;
      this.clazz = clazz;
   }
   public final String getPath() {
      return this.path;
   }
   @Nullable
   public final ClassLoader getClassLoader() {
      return (this.clazz != null ? this.clazz.getClassLoader() : this.classLoader);
   }
   @Override
   public boolean exists() {
      return (resolveURL() != null);
   }
   @Nullable
   protected URL resolveURL() {
      if (this.clazz != null) {
         return this.clazz.getResource(this.path);
      }
      else if (this.classLoader != null) {
         return this.classLoader.getResource(this.path);
      }
      else {
         return ClassLoader.getSystemResource(this.path);
      }
   }
   @Override
   public InputStream getInputStream() throws IOException {
      InputStream is;
      if (this.clazz != null) {
         is = this.clazz.getResourceAsStream(this.path);
      }
      else if (this.classLoader != null) {
         is = this.classLoader.getResourceAsStream(this.path);
      }
      else {
         is = ClassLoader.getSystemResourceAsStream(this.path);
      }
      if (is == null) {
         throw new FileNotFoundException(getDescription() + " cannot be opened because it does not exist");
      }
      return is;
   }
   @Override
   public URL getURL() throws IOException {
      URL url = resolveURL();
      if (url == null) {
         throw new FileNotFoundException(getDescription() + " cannot be resolved to URL because it does not exist");
      }
      return url;
   }
   @Override
   public Resource createRelative(String relativePath) {
      String pathToUse = StringUtils.applyRelativePath(this.path, relativePath);
      return (this.clazz != null ? new ClassPathResource(pathToUse, this.clazz) :
            new ClassPathResource(pathToUse, this.classLoader));
   }
   @Override
   @Nullable
   public String getFilename() {
      return StringUtils.getFilename(this.path);
   }
   @Override
   public String getDescription() {
      StringBuilder builder = new StringBuilder("class path resource [");
      String pathToUse = path;
      if (this.clazz != null && !pathToUse.startsWith("/")) {
         builder.append(ClassUtils.classPackageAsResourcePath(this.clazz));
         builder.append('/');
      }
      if (pathToUse.startsWith("/")) {
         pathToUse = pathToUse.substring(1);
      }
      builder.append(pathToUse);
      builder.append(']');
      return builder.toString();
   }
   @Override
   public boolean equals(Object obj) {
      if (obj == this) {
         return true;
      }
      if (obj instanceof ClassPathResource) {
         ClassPathResource otherRes = (ClassPathResource) obj;
         return (this.path.equals(otherRes.path) &&
               ObjectUtils.nullSafeEquals(this.classLoader, otherRes.classLoader) &&
               ObjectUtils.nullSafeEquals(this.clazz, otherRes.clazz));
      }
      return false;
   }
   @Override
   public int hashCode() {
      return this.path.hashCode();
   }
}
```

**4、** FileSystemResource是针对java.io.File提供的Resource实现；

```java
public class FileSystemResource extends AbstractResource implements WritableResource {
   private final File file;
   private final String path;
   public FileSystemResource(File file) {
      Assert.notNull(file, "File must not be null");
      this.file = file;
      this.path = StringUtils.cleanPath(file.getPath());
   }
   public FileSystemResource(String path) {
      Assert.notNull(path, "Path must not be null");
      this.file = new File(path);
      this.path = StringUtils.cleanPath(path);
   }
   public final String getPath() {
      return this.path;
   }
   @Override
   public boolean exists() {
      return this.file.exists();
   }
   @Override
   public boolean isReadable() {
      return (this.file.canRead() && !this.file.isDirectory());
   }
   @Override
   public InputStream getInputStream() throws IOException {
      try {
         return Files.newInputStream(this.file.toPath());
      }
      catch (NoSuchFileException ex) {
         throw new FileNotFoundException(ex.getMessage());
      }
   }
   @Override
   public boolean isWritable() {
      return (this.file.canWrite() && !this.file.isDirectory());
   }
   @Override
   public OutputStream getOutputStream() throws IOException {
      return Files.newOutputStream(this.file.toPath());
   }
   @Override
   public URL getURL() throws IOException {
      return this.file.toURI().toURL();
   }
   @Override
   public URI getURI() throws IOException {
      return this.file.toURI();
   }
   @Override
   public boolean isFile() {
      return true;
   }
   @Override
   public File getFile() {
      return this.file;
   }
   @Override
   public ReadableByteChannel readableChannel() throws IOException {
      try {
         return FileChannel.open(this.file.toPath(), StandardOpenOption.READ);
      }
      catch (NoSuchFileException ex) {
         throw new FileNotFoundException(ex.getMessage());
      }
   }
   @Override
   public WritableByteChannel writableChannel() throws IOException {
      return FileChannel.open(this.file.toPath(), StandardOpenOption.WRITE);
   }
   @Override
   public long contentLength() throws IOException {
      return this.file.length();
   }
   @Override
   public Resource createRelative(String relativePath) {
      String pathToUse = StringUtils.applyRelativePath(this.path, relativePath);
      return new FileSystemResource(pathToUse);
   }
   @Override
   public String getFilename() {
      return this.file.getName();
   }
   @Override
   public String getDescription() {
      return "file [" + this.file.getAbsolutePath() + "]";
   }
   @Override
   public boolean equals(Object obj) {
      return (obj == this ||
         (obj instanceof FileSystemResource && this.path.equals(((FileSystemResource) obj).path)));
   }
   @Override
   public int hashCode() {
      return this.path.hashCode();
   }
}
```

**5、** ServletContextResource为了获取web根路径的ServletContext资源而提供的Resource实现；

```java
public class ServletContextResource extends AbstractFileResolvingResource implements ContextResource {
   private final ServletContext servletContext;
   private final String path;
   public ServletContextResource(ServletContext servletContext, String path) {
      // check ServletContext
      Assert.notNull(servletContext, "Cannot resolve ServletContextResource without ServletContext");
      this.servletContext = servletContext;
      // check path
      Assert.notNull(path, "Path is required");
      String pathToUse = StringUtils.cleanPath(path);
      if (!pathToUse.startsWith("/")) {
         pathToUse = "/" + pathToUse;
      }
      this.path = pathToUse;
   }
   public final ServletContext getServletContext() {
      return this.servletContext;
   }
   public final String getPath() {
      return this.path;
   }
   @Override
   public boolean exists() {
      try {
         URL url = this.servletContext.getResource(this.path);
         return (url != null);
      }
      catch (MalformedURLException ex) {
         return false;
      }
   }
   @Override
   public boolean isReadable() {
      InputStream is = this.servletContext.getResourceAsStream(this.path);
      if (is != null) {
         try {
            is.close();
         }
         catch (IOException ex) {
            // ignore
         }
         return true;
      }
      else {
         return false;
      }
   }
   @Override
   public boolean isFile() {
      try {
         URL url = this.servletContext.getResource(this.path);
         if (url != null && ResourceUtils.isFileURL(url)) {
            return true;
         }
         else {
            return (this.servletContext.getRealPath(this.path) != null);
         }
      }
      catch (MalformedURLException ex) {
         return false;
      }
   }
   @Override
   public InputStream getInputStream() throws IOException {
      InputStream is = this.servletContext.getResourceAsStream(this.path);
      if (is == null) {
         throw new FileNotFoundException("Could not open " + getDescription());
      }
      return is;
   }
   @Override
   public URL getURL() throws IOException {
      URL url = this.servletContext.getResource(this.path);
      if (url == null) {
         throw new FileNotFoundException(
               getDescription() + " cannot be resolved to URL because it does not exist");
      }
      return url;
   }
   @Override
   public File getFile() throws IOException {
      URL url = this.servletContext.getResource(this.path);
      if (url != null && ResourceUtils.isFileURL(url)) {
         // Proceed with file system resolution...
         return super.getFile();
      }
      else {
         String realPath = WebUtils.getRealPath(this.servletContext, this.path);
         return new File(realPath);
      }
   }
   @Override
   public Resource createRelative(String relativePath) {
      String pathToUse = StringUtils.applyRelativePath(this.path, relativePath);
      return new ServletContextResource(this.servletContext, pathToUse);
   }
   @Override
   @Nullable
   public String getFilename() {
      return StringUtils.getFilename(this.path);
   }
   @Override
   public String getDescription() {
      return "ServletContext resource [" + this.path + "]";
   }
   @Override
   public String getPathWithinContext() {
      return this.path;
   }
   @Override
   public boolean equals(Object obj) {
      if (obj == this) {
         return true;
      }
      if (obj instanceof ServletContextResource) {
         ServletContextResource otherRes = (ServletContextResource) obj;
         return (this.servletContext.equals(otherRes.servletContext) && this.path.equals(otherRes.path));
      }
      return false;
   }
   @Override
   public int hashCode() {
      return this.path.hashCode();
   }
}
```

**6、** 在确实没有找到其他合适的Resource实现时，才使用InputSteamResource；

```java
public class InputStreamResource extends AbstractResource {
   private final InputStream inputStream;
   private final String description;
   private boolean read = false;
   public InputStreamResource(InputStream inputStream) {
      this(inputStream, "resource loaded through InputStream");
   }
   public InputStreamResource(InputStream inputStream, @Nullable String description) {
      Assert.notNull(inputStream, "InputStream must not be null");
      this.inputStream = inputStream;
      this.description = (description != null ? description : "");
   }
   @Override
   public boolean exists() {
      return true;
   }
   @Override
   public boolean isOpen() {
      return true;
   }
   @Override
   public InputStream getInputStream() throws IOException, IllegalStateException {
      if (this.read) {
         throw new IllegalStateException("InputStream has already been read - " +
               "do not use InputStreamResource if a stream needs to be read multiple times");
      }
      this.read = true;
      return this.inputStream;
   }
   @Override
   public String getDescription() {
      return "InputStream resource [" + this.description + "]";
   }
   @Override
   public boolean equals(Object obj) {
      return (obj == this ||
         (obj instanceof InputStreamResource && ((InputStreamResource) obj).inputStream.equals(this.inputStream)));
   }
   @Override
   public int hashCode() {
      return this.inputStream.hashCode();
   }
}
```

**7、** 当需要从字节数组加载内容时，ByteArrayResource是一个不错的选择，使用ByteArrayResource可以不用求助于InputStreamResource；

```java
public class ByteArrayResource extends AbstractResource {
   private final byte[] byteArray;
   private final String description;
   public ByteArrayResource(byte[] byteArray) {
      this(byteArray, "resource loaded from byte array");
   }
   public ByteArrayResource(byte[] byteArray, @Nullable String description) {
      Assert.notNull(byteArray, "Byte array must not be null");
      this.byteArray = byteArray;
      this.description = (description != null ? description : "");
   }
   public final byte[] getByteArray() {
      return this.byteArray;
   }
   @Override
   public boolean exists() {
      return true;
   }
   @Override
   public long contentLength() {
      return this.byteArray.length;
   }
   @Override
   public InputStream getInputStream() throws IOException {
      return new ByteArrayInputStream(this.byteArray);
   }
   @Override
   public String getDescription() {
      return "Byte array resource [" + this.description + "]";
   }
   @Override
   public boolean equals(Object obj) {
      return (obj == this ||
         (obj instanceof ByteArrayResource && Arrays.equals(((ByteArrayResource) obj).byteArray, this.byteArray)));
   }
   @Override
   public int hashCode() {
      return (byte[].class.hashCode() * 29 * this.byteArray.length);
   }
}
```
