# 07、Solr4.8.0源码分析(7)之Solr SPI
- 来源：https://ddkk.com/zhuanlan/search/solr/1/7.html
- 分类：搜索引擎
- 分组：教程目录
查看Solr源码时候会发现，每一个package都会由对应的resources. 如下图所示：

一时对这玩意好奇了，看了文档以后才发现，这个services就是java SPI机制。首先介绍下java SPI机制，然后再结合Solr谈一下SPI。

## 1. JAVA SPI

当服务的提供者，提供了服务接口的一种实现之后，在jar包的META-INF/services/目录里同时创建一个以服务接口命名的文件。该文件里就是实现该服务接口的具体实现类。而当外部程序装配这个模块的时候，就能通过该jar包META-INF/services/里的配置文件找到具体的实现类名，并装载实例化，完成模块的注入。

基于这样一个约定就能很好的找到服务接口的实现类，而不需要再代码里制定。

jdk提供服务实现查找的一个工具类：java.util.ServiceLoader

假设有一个内容搜索系统，分为展示和搜索两个模块。展示和搜索基于接口编程。搜索的实现可能是基于文件系统的搜索，也可能是基于数据库的搜索。实例代码如下：

Search.java: 搜索接口

```java
package search;
import java.util.List;
import definition.Doc;
public interface Search {
    List<Doc> search(String keyword);
}
```

FileSearch.java:文件系统的搜索实现

```java
package search;
import java.util.List;
import definition.Doc;
public class FileSearch implements Search {
    @Override
    public List<Doc> search(String keyword) {
        System.out.println("now use file system search. keyword:" + keyword);
        return null;
    }
}
```

DatabaseSearch.java

```java
package search;
import java.util.List;
import definition.Doc;
public class DatabaseSearch implements Search {
    @Override
    public List<Doc> search(String keyword) {
        System.out.println("now use database search. keyword:" + keyword);
        return null;
    }
}
```

SearchTest.java

```java
package search;
import java.util.Iterator;
import java.util.ServiceLoader;
public class SearchTest {
    public static void main(String[] args) {
        ServiceLoader<Search> s = ServiceLoader.load(Search.class);
        Iterator<Search> searchs = s.iterator();
        if (searchs.hasNext()) {
            Search curSearch = searchs.next();
            curSearch.search("test");
        }
    }
}
```

最后创建在META-INF/searvices/search.Search文件。

当search.Search文件内容是"search.FileSearch"时，程序输出是：

nowuse file system search. keyword:test

当search.Search文件内容是"search.DatabaseSearch"时，程序输出是：

nowuse database search. keyword:test

可以看出SearchTest里没有任何和具体实现有关的代码，而是基于spi的机制去查找服务的实现。

## 2. Solr SPI

以Codec类为例，查看resources/META-INF/services/org.apache.lucene.codecs.Codec:可以看出Codec服务接口具有以下具体的实现类。这就很好的解释了Solrconfig.xml里面的LuceneVersion的配置，也为Lucene的向前兼容提供了保障。

```java
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
org.apache.lucene.codecs.lucene40.Lucene40Codec
org.apache.lucene.codecs.lucene3x.Lucene3xCodec
org.apache.lucene.codecs.lucene41.Lucene41Codec
org.apache.lucene.codecs.lucene42.Lucene42Codec
org.apache.lucene.codecs.lucene45.Lucene45Codec
org.apache.lucene.codecs.lucene46.Lucene46Codec
```

接下来可以看下Codec服务接口的实现代码

```java
package org.apache.lucene.codecs;
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import java.util.Set;
import java.util.ServiceLoader; // javadocs
import org.apache.lucene.index.IndexWriterConfig; // javadocs
import org.apache.lucene.util.NamedSPILoader;
/**
 * Encodes/decodes an inverted index segment.
 * <p>
 * Note, when extending this class, the name ({@linkgetName}) is 
 * written into the index. In order for the segment to be read, the
 * name must resolve to your implementation via {@linkforName(String)}.
 * This method uses Java's 
 * {@link ServiceLoader Service Provider Interface} (SPI) to resolve codec names.
 * <p>
 * If you implement your own codec, make sure that it has a no-arg constructor
 * so SPI can load it.
 * @see ServiceLoader
 */
public abstract class Codec implements NamedSPILoader.NamedSPI {
private static final NamedSPILoader<Codec> loader =
new NamedSPILoader<>(Codec.class);
private final String name;
/**
* Creates a new codec.
* <p>
* The provided name will be written into the index segment: in order to
* for the segment to be read this class should be registered with Java's
* SPI mechanism (registered in META-INF/ of your jar file, etc).
* @param name must be all ascii alphanumeric, and less than 128 characters in length.
*/
protected Codec(String name) {
NamedSPILoader.checkServiceName(name);
this.name = name;
}
/** Returns this codec's name */
@Override
public final String getName() {
return name;
}
/**
* 以下几个Format跟Lucene的索引文件格式有关
* */
/** Encodes/decodes postings */
public abstract PostingsFormat postingsFormat();
/** Encodes/decodes docvalues */
public abstract DocValuesFormat docValuesFormat();
/** Encodes/decodes stored fields */
public abstract StoredFieldsFormat storedFieldsFormat();
/** Encodes/decodes term vectors */
public abstract TermVectorsFormat termVectorsFormat();
/** Encodes/decodes field infos file */
public abstract FieldInfosFormat fieldInfosFormat();
/** Encodes/decodes segment info file */
public abstract SegmentInfoFormat segmentInfoFormat();
/** Encodes/decodes document normalization values */
public abstract NormsFormat normsFormat();
/** Encodes/decodes live docs */
public abstract LiveDocsFormat liveDocsFormat();
/**
 * 根据名字在已有的Codec实例中寻找符合
 * */
/** looks up a codec by name */
public static Codec forName(String name) {
  if (loader == null) {
    throw new IllegalStateException("You called Codec.forName() before all Codecs could be initialized. "+
        "This likely happens if you call it from a Codec's ctor.");
  }
  return loader.lookup(name);
}
/**
 * 返回有效的Codecs实例
 * */
/** returns a list of all available codec names */
public static Set<String> availableCodecs() {
  if (loader == null) {
    throw new IllegalStateException("You called Codec.availableCodecs() before all Codecs could be initialized. "+
        "This likely happens if you call it from a Codec's ctor.");
  }
  return loader.availableServices();
}
/**
 * 更新Codec实例列表，Codec实例列表只能添加，不能删除与更改。
 * */
/** 
 * Reloads the codec list from the given {@link ClassLoader}.
 * Changes to the codecs are visible after the method ends, all
 * iterators ({@linkavailableCodecs()},...) stay consistent. 
 * 
 * <p><b>NOTE:</b> Only new codecs are added, existing ones are
 * never removed or replaced.
 * 
 * <p><em>This method is expensive and should only be called for discovery
 * of new codecs on the given classpath/classloader!</em>
 */
public static void reloadCodecs(ClassLoader classloader) {
  loader.reload(classloader);
}
/**
 * 默认为Lucene46，也就是说默认调用的是org.apache.lucene.codecs.lucene46.Lucene46Codec
 * */
private static Codec defaultCodec = Codec.forName("Lucene46");
/**
 * 返回默认的Codec实例
 * */
/** expert: returns the default codec used for newly created
 *  {@link IndexWriterConfig}s.
 */
// TODO: should we use this, or maybe a system property is better?
public static Codec getDefault() {
  return defaultCodec;
}
/**
 * 设置默认的Codec实例
 * */
/** expert: sets the default codec used for newly created
 *  {@link IndexWriterConfig}s.
 */
public static void setDefault(Codec codec) {
  defaultCodec = codec;
}
/**
 * returns the codec's name. Subclasses can override to provide
 * more detail (such as parameters).
 */
@Override
public String toString() {
  return name;
}
}
```

代码比较简单明了，接下来再看下NamedSPILoader.NamedSPI，它封装了JAVA SPI的实现：

```java
package org.apache.lucene.util;
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import java.util.Collections;
import java.util.Iterator;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.ServiceConfigurationError;
/**
 * Helper class for loading named SPIs from classpath (e.g. Codec, PostingsFormat).
 * @lucene.internal
 */
public final class NamedSPILoader<S extends NamedSPILoader.NamedSPI> implements Iterable<S> {
  /**
   * SPI service Map,存放服务对应的实例类。
   * */
  private volatile Map<String,S> services = Collections.emptyMap();
  private final Class<S> clazz;
  public NamedSPILoader(Class<S> clazz) {
    this(clazz, Thread.currentThread().getContextClassLoader());
  }
  public NamedSPILoader(Class<S> clazz, ClassLoader classloader) {
    this.clazz = clazz;
    // if clazz' classloader is not a parent of the given one, we scan clazz's classloader, too:
    final ClassLoader clazzClassloader = clazz.getClassLoader();
    if (clazzClassloader != null && !SPIClassIterator.isParentClassLoader(clazzClassloader, classloader)) {
      reload(clazzClassloader);
    }
    reload(classloader);
  }
  /**
   * 更新SPI MAP services。遍历META-INF/services文件，如果services MAP没有该实例，则新建实例，并放入services MAP
   * */
  /** 
   * Reloads the internal SPI list from the given {@link ClassLoader}.
   * Changes to the service list are visible after the method ends, all
   * iterators ({@linkiterator()},...) stay consistent. 
   * 
   * <p><b>NOTE:</b> Only new service providers are added, existing ones are
   * never removed or replaced.
   * 
   * <p><em>This method is expensive and should only be called for discovery
   * of new service providers on the given classpath/classloader!</em>
   */
  public synchronized void reload(ClassLoader classloader) {
    final LinkedHashMap<String,S> services = new LinkedHashMap<>(this.services);
    final SPIClassIterator<S> loader = SPIClassIterator.get(clazz, classloader);
    while (loader.hasNext()) {
      final Class<? extends S> c = loader.next();
      try {
        final S service = c.newInstance();
        final String name = service.getName();
        // only add the first one for each name, later services will be ignored
        // this allows to place services before others in classpath to make 
        // them used instead of others
        if (!services.containsKey(name)) {
          checkServiceName(name);
          services.put(name, service);
        }
      } catch (Exception e) {
        throw new ServiceConfigurationError("Cannot instantiate SPI class: " + c.getName(), e);
      }
    }
    this.services = Collections.unmodifiableMap(services);
  }
  /**
   * Validates that a service name meets the requirements of {@link NamedSPI}
   */
  public static void checkServiceName(String name) {
    // based on harmony charset.java
    if (name.length() >= 128) {
      throw new IllegalArgumentException("Illegal service name: '" + name + "' is too long (must be < 128 chars).");
    }
    for (int i = 0, len = name.length(); i < len; i++) {
      char c = name.charAt(i);
      if (!isLetterOrDigit(c)) {
        throw new IllegalArgumentException("Illegal service name: '" + name + "' must be simple ascii alphanumeric.");
      }
    }
  }
  /**
   * Checks whether a character is a letter or digit (ascii) which are defined in the spec.
   */
  private static boolean isLetterOrDigit(char c) {
    return ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9');
  }
  /**
   * 在Services MAP里面查找是否已有name的实例
   * */
  public S lookup(String name) {
    final S service = services.get(name);
    if (service != null) return service;
    throw new IllegalArgumentException("A SPI class of type "+clazz.getName()+" with name '"+name+"' does not exist. "+
     "You need to add the corresponding JAR file supporting this SPI to your classpath."+
     "The current classpath supports the following names: "+availableServices());
  }
  public Set<String> availableServices() {
    return services.keySet();
  }
  @Override
  public Iterator<S> iterator() {
    return services.values().iterator();
  }
  /**
   * Interface to support {@link NamedSPILoader#lookup(String)} by name.
   * <p>
   * Names must be all ascii alphanumeric, and less than 128 characters in length.
   */
  public static interface NamedSPI {
    String getName();
  }
}
```

接下来看看Solr是怎么获取services的实例信息的

```java
package org.apache.lucene.util;
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import java.io.IOException;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.ServiceConfigurationError;
/**
 * Helper class for loading SPI classes from classpath (META-INF files).
 * This is a light impl of {@link java.util.ServiceLoader} but is guaranteed to
 * be bug-free regarding classpath order and does not instantiate or initialize
 * the classes found.
 *
 * @lucene.internal
 */
public final class SPIClassIterator<S> implements Iterator<Class<? extends S>> {
  //service路径
  private static final String META_INF_SERVICES = "META-INF/services/";
  private final Class<S> clazz;
  private final ClassLoader loader;
  private final Enumeration<URL> profilesEnum;
  private Iterator<String> linesIterator;
  public static <S> SPIClassIterator<S> get(Class<S> clazz) {
    return new SPIClassIterator<>(clazz, Thread.currentThread().getContextClassLoader());
  }
  public static <S> SPIClassIterator<S> get(Class<S> clazz, ClassLoader loader) {
    return new SPIClassIterator<>(clazz, loader);
  }
  /** Utility method to check if some class loader is a (grand-)parent of or the same as another one.
   * This means the child will be able to load all classes from the parent, too. */
  public static boolean isParentClassLoader(final ClassLoader parent, ClassLoader child) {
    while (child != null) {
      if (child == parent) {
        return true;
      }
      child = child.getParent();
    }
    return false;
  }
  /**
   * 解析META-INF/services/clazz.getname文件
   * */
  private SPIClassIterator(Class<S> clazz, ClassLoader loader) {
    this.clazz = clazz;
    try {
      final String fullName = META_INF_SERVICES + clazz.getName();
      this.profilesEnum = (loader == null) ? ClassLoader.getSystemResources(fullName) : loader.getResources(fullName);
    } catch (IOException ioe) {
      throw new ServiceConfigurationError("Error loading SPI profiles for type " + clazz.getName() + " from classpath", ioe);
    }
    this.loader = (loader == null) ? ClassLoader.getSystemClassLoader() : loader;
    this.linesIterator = Collections.<String>emptySet().iterator();
  }
  /**
   * 获取META-INF/services/clazz.getname的clazz服务实例
   * */
  private boolean loadNextProfile() {
    ArrayList<String> lines = null;
    while (profilesEnum.hasMoreElements()) {
      if (lines != null) {
        lines.clear();
      } else {
        lines = new ArrayList<>();
      }
      final URL url = profilesEnum.nextElement();
      try {
        final InputStream in = url.openStream();
        IOException priorE = null;
        try {
          final BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
          String line;
          while ((line = reader.readLine()) != null) {
            final int pos = line.indexOf('#');
            if (pos >= 0) {
              line = line.substring(0, pos);
            }
            line = line.trim();
            if (line.length() > 0) {
              lines.add(line);
            }
          }
        } catch (IOException ioe) {
          priorE = ioe;
        } finally {
          IOUtils.closeWhileHandlingException(priorE, in);
        }
      } catch (IOException ioe) {
        throw new ServiceConfigurationError("Error loading SPI class list from URL: " + url, ioe);
      }
      if (!lines.isEmpty()) {
        this.linesIterator = lines.iterator();
        return true;
      }
    }
    return false;
  }
  @Override
  public boolean hasNext() {
    return linesIterator.hasNext() || loadNextProfile();
  }
  @Override
  public Class<? extends S> next() {
    // hasNext() implicitely loads the next profile, so it is essential to call this here!
    if (!hasNext()) {
      throw new NoSuchElementException();
    }
    assert linesIterator.hasNext();
    final String c = linesIterator.next();
    try {
      // don't initialize the class (pass false as 2nd parameter):
      return Class.forName(c, false, loader).asSubclass(clazz);
    } catch (ClassNotFoundException cnfe) {
      throw new ServiceConfigurationError(String.format(Locale.ROOT, "A SPI class of type %s with classname %s does not exist, "+
        "please fix the file '%s%1$s' in your classpath.", clazz.getName(), c, META_INF_SERVICES));
    }
  }
  @Override
  public void remove() {
    throw new UnsupportedOperationException();
  }
}
```

由此可见SOLR SPI的流程是如下的：以Codec为例

**1、** SPIClassIterator获取所有META-INF/services/org.apache.lucene.codecs.Codec的实例类信息；

**2、** NamedSPILoader实例化所有META-INF/services/org.apache.lucene.codecs.Codec的实例类，并放入servicesMAP里面；

**3、** Codec默认为Lucene46，从servicesMAP获取Lucene46的实例类org.apache.lucene.codecs.lucene46.Lucene46Codec；

```java
package org.apache.lucene.codecs.lucene46;
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import org.apache.lucene.codecs.Codec;
import org.apache.lucene.codecs.DocValuesFormat;
import org.apache.lucene.codecs.FieldInfosFormat;
import org.apache.lucene.codecs.FilterCodec;
import org.apache.lucene.codecs.LiveDocsFormat;
import org.apache.lucene.codecs.NormsFormat;
import org.apache.lucene.codecs.PostingsFormat;
import org.apache.lucene.codecs.SegmentInfoFormat;
import org.apache.lucene.codecs.StoredFieldsFormat;
import org.apache.lucene.codecs.TermVectorsFormat;
import org.apache.lucene.codecs.lucene40.Lucene40LiveDocsFormat;
import org.apache.lucene.codecs.lucene41.Lucene41StoredFieldsFormat;
import org.apache.lucene.codecs.lucene42.Lucene42NormsFormat;
import org.apache.lucene.codecs.lucene42.Lucene42TermVectorsFormat;
import org.apache.lucene.codecs.perfield.PerFieldDocValuesFormat;
import org.apache.lucene.codecs.perfield.PerFieldPostingsFormat;
/**
 * Implements the Lucene 4.6 index format, with configurable per-field postings
 * and docvalues formats.
 * <p>
 * If you want to reuse functionality of this codec in another codec, extend
 * {@link FilterCodec}.
 *
 * @see org.apache.lucene.codecs.lucene46 package documentation for file format details.
 * @lucene.experimental
 */
// NOTE: if we make largish changes in a minor release, easier to just make Lucene46Codec or whatever
// if they are backwards compatible or smallish we can probably do the backwards in the postingsreader
// (it writes a minor version, etc).
public class Lucene46Codec extends Codec {
  private final StoredFieldsFormat fieldsFormat = new Lucene41StoredFieldsFormat();
  private final TermVectorsFormat vectorsFormat = new Lucene42TermVectorsFormat();
  private final FieldInfosFormat fieldInfosFormat = new Lucene46FieldInfosFormat();
  private final SegmentInfoFormat segmentInfosFormat = new Lucene46SegmentInfoFormat();
  private final LiveDocsFormat liveDocsFormat = new Lucene40LiveDocsFormat();
  private final PostingsFormat postingsFormat = new PerFieldPostingsFormat() {
    @Override
    public PostingsFormat getPostingsFormatForField(String field) {
      return Lucene46Codec.this.getPostingsFormatForField(field);
    }
  };
  private final DocValuesFormat docValuesFormat = new PerFieldDocValuesFormat() {
    @Override
    public DocValuesFormat getDocValuesFormatForField(String field) {
      return Lucene46Codec.this.getDocValuesFormatForField(field);
    }
  };
  /** Sole constructor. */
  public Lucene46Codec() {
    super("Lucene46");
  }
  @Override
  public final StoredFieldsFormat storedFieldsFormat() {
    return fieldsFormat;
  }
  @Override
  public final TermVectorsFormat termVectorsFormat() {
    return vectorsFormat;
  }
  @Override
  public final PostingsFormat postingsFormat() {
    return postingsFormat;
  }
  @Override
  public final FieldInfosFormat fieldInfosFormat() {
    return fieldInfosFormat;
  }
  @Override
  public final SegmentInfoFormat segmentInfoFormat() {
    return segmentInfosFormat;
  }
  @Override
  public final LiveDocsFormat liveDocsFormat() {
    return liveDocsFormat;
  }
  /** Returns the postings format that should be used for writing 
   *  new segments of <code>field</code>.
   *  
   *  The default implementation always returns "Lucene41"
   */
  public PostingsFormat getPostingsFormatForField(String field) {
    return defaultFormat;
  }
  /** Returns the docvalues format that should be used for writing 
   *  new segments of <code>field</code>.
   *  
   *  The default implementation always returns "Lucene45"
   */
  public DocValuesFormat getDocValuesFormatForField(String field) {
    return defaultDVFormat;
  }
  @Override
  public final DocValuesFormat docValuesFormat() {
    return docValuesFormat;
  }
  private final PostingsFormat defaultFormat = PostingsFormat.forName("Lucene41");
  private final DocValuesFormat defaultDVFormat = DocValuesFormat.forName("Lucene45");
  private final NormsFormat normsFormat = new Lucene42NormsFormat();
  @Override
  public final NormsFormat normsFormat() {
    return normsFormat;
  }
}
```
