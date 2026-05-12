# 52、SpringBoot 源码分析 - ConfigFileApplicationListener配置文件加载原理三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/52.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图

## application配置文件加载

我们考虑简单的`application`配置文件的加载，其实这个时候只是个名字，后面会进行前后缀的拼接。

### application配置文件加载

接下来就遍历名字集合，然后进行加载,主要是下面这段，其实这里就是获取所有的属性源加载器，比如`PropertiesPropertySourceLoader`是加载`"properties", "xml"`后缀的，`YamlPropertySourceLoader`是加载`"yml", "yaml"`后缀的，所以这里就遍历出题目的后缀，然后里面进行路径拼接后尝试加载：

```java
private void load(String location, String name, Profile profile, DocumentFilterFactory filterFactory,
				DocumentConsumer consumer) {
			...
			Set<String> processed = new HashSet<>();
			for (PropertySourceLoader loader : this.propertySourceLoaders) {
				for (String fileExtension : loader.getFileExtensions()) {
					if (processed.add(fileExtension)) {
					//进行了路径拼接
						loadForFileExtension(loader, location + name, "." + fileExtension, profile, filterFactory,
								consumer);
					}
				}
			}
		}
```

所以这里知道为什么`yaml`可以写成`yml`。

#### loadForFileExtension

这里很关键的点就是`profile`参数是`null`，因为前面说过，会放一个`null`进去，为了加载特定的配置文件，比如`classpath:/application..properties`。然后直接进行`load`。如果已经有存在的话就会尝试去加载相关的环境配置文件。

```java
private void loadForFileExtension(PropertySourceLoader loader, String prefix, String fileExtension,
				Profile profile, DocumentFilterFactory filterFactory, DocumentConsumer consumer) {
			//进行环境配置的加载 也就是xxx-dev-xx.xx这种
			DocumentFilter defaultFilter = filterFactory.getDocumentFilter(null);
			DocumentFilter profileFilter = filterFactory.getDocumentFilter(profile);
			if (profile != null) {
				// Try profile-specific file & profile section in profile file (gh-340)
				String profileSpecificFile = prefix + "-" + profile + fileExtension;
				load(loader, profileSpecificFile, profile, defaultFilter, consumer);
				load(loader, profileSpecificFile, profile, profileFilter, consumer);
				// Try profile specific sections in files we've already processed
				for (Profile processedProfile : this.processedProfiles) {
					if (processedProfile != null) {
						String previouslyLoaded = prefix + "-" + processedProfile + fileExtension;
						load(loader, previouslyLoaded, profile, profileFilter, consumer);
					}
				}
			}
			// Also try the profile-specific section (if any) of the normal file
			load(loader, prefix + fileExtension, profile, profileFilter, consumer);
		}
```

##### load开始加载配置文件

不存在的话就返回，然后进行文件名的后缀符检查和是否是目录的检查。

##### loadDocuments加载文档

然后才开始加载`loadDocuments`，其实内部就是用传进来的加载器加载，当然会先看缓存里有没有，没有就加载，加载到后放缓存：

比如`PropertiesPropertySourceLoader`加载到的信息：

最后封装成一个`OriginTrackedMapPropertySource`类型的集合返回。

##### 处理环境配置

然后进行环境配置的检查，如果配置属性里有`spring.profiles.active`和`spring.profiles.include`的配置的话会进行处理，这里面就会看到我最开始说的，如果有配置了，就会把默认配置给删除。

##### addActiveProfiles添加激活环境

如果已经有激活环境了`activatedProfiles=true`，不能覆盖，返回，否则就添加到配置里，然后删除没处理的默认环境。

```java
	void addActiveProfiles(Set<Profile> profiles) {
			if (profiles.isEmpty()) {
				return;
			}
			if (this.activatedProfiles) {
				if (this.logger.isDebugEnabled()) {
					this.logger.debug("Profiles already activated, '" + profiles + "' will not be applied");
				}
				return;
			}
			//添加到配置队列里
			this.profiles.addAll(profiles);
			if (this.logger.isDebugEnabled()) {
				this.logger.debug("Activated activeProfiles " + StringUtils.collectionToCommaDelimitedString(profiles));
			}
			this.activatedProfiles = true;
			removeUnprocessedDefaultProfiles();
		}
```

##### removeUnprocessedDefaultProfiles

删除配置中没有处理的默认的环境，这个就是我说的，前面为什么要先加个`null`，然后才是默认配置，因为如果找到了配置就会把默认配置删除了，因为有了配置当然不需要默认的啦，所以这里应该是个小技巧，不是先去找默认的，而是先去找约定的那些，约定大于配置。

```java
		private void removeUnprocessedDefaultProfiles() {
			this.profiles.removeIf((profile) -> (profile != null && profile.isDefaultProfile()));
		}
```

下篇继续将有了配置环境后怎么处理。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
