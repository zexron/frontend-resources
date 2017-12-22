/**
 * Author: xuning
 * Date: 2017-9-22.
 *
 * Statistic类，香奈儿Training统计库
 *
 */
class Statistic {
  /**
   *
   * @param options 可用选项：
   * {
   *    topicId:{String} 话题名，无需添加前缀项目名和前缀类型如 Timepoint-Project-Login只需填Login
   *    type:{String} 统计类型，可选参数: timepoint, duration, exam
   * }
   *
   */
  constructor (options) {
    let self = this

    if (!Statistic.initialized) {
      console.warn('Statistic: not Initialized')
    }

    self.topicId = options.topic
    self.type = options.type
    self.url = Statistic.URL[options.type]
    self.data = {
      topicId: self.type.substr(0, 1).toUpperCase() + self.type.substr(1) + '-' + Statistic.ProjectName + '-' + self.topicId,
      userId: Statistic.userId
    }

    self.running = false
    self.ends = true
    self.connecting = false
  }

  /**
   * 发送对应数据，debugMode:true的情况下以log形式打印在控制台
   * @param[Optional] value
   * @returns {Statistic}
   */
  sendData (value) {
    let self = this
    let params = '?'

    self.data.value = (value === 'now' || value === undefined || value === null) ? null : value

    Object.keys(self.data).forEach((key) => {
      let val = self.data[key]
      if (val) {
        params += key + '=' + val + '&'
      }
    })

    params = params.substr(0, params.length - 1)

    if (!Statistic.debugMode) {
      let xhr = new XMLHttpRequest()
      self.connecting = true
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          self.connecting = false

          if (xhr.status === 200) {
            console.log(xhr.response)
          }
        }
      }
      xhr.open('PUT', self.url + params)
      xhr.send()
    } else {
      let now = new Date()
      let lastTime = self.type === 'duration' ? new Date(self.lastTime) : null
      console.groupCollapsed(self.data.topicId)
      console.info(self.type)
      console.info(self.data.value !== null ? self.data.value : `${now.getMinutes()}:${now.getSeconds()}`)
      self.type === 'duration' && console.info(`${lastTime.getMinutes()}:${lastTime.getSeconds()}-${now.getMinutes()}:${now.getSeconds()}`)
      console.groupEnd()
    }

    return self
  }

  /**
   * 设置topic名
   * 对于type:duration，设置topic名会先暂停当前计数，设置完对应名字之后在下一个渲染帧继续开启
   * @param topic
   * topic参数配置法与构造函数的topicId一致
   * @returns {Statistic}
   */
  setTopic (topic) {
    let self = this

    if (self.type === 'duration' && self.running === true) {
      self.end(true)
      setTimeout(function () {
        self.start()
      }, 0)
    }

    self.topicId = topic
    self.data.topicId = self.type.substr(0, 1).toUpperCase() + self.type.substr(1) + '-' + Statistic.ProjectName + '-' + self.topicId

    return self
  }

  // For type:duration
  /**
   * type:duration的统计类开始计时
   * @returns {Statistic}
   */
  start () {
    this.running = true
    this.ends = false
    this.lastTime = +Date.now()
    Statistic.durationStack.push(this)
    return this
  }

  /**
   * type:duration的统计类暂停计时
   * @param setTopic  是否由setTopic方法调用，默认为false，直接调用请不要设置为true
   * @returns {Statistic}
   */
  end (setTopic = false) {
    this.running = false
    this.ends = !setTopic
    this.sendData(+Date.now() - this.lastTime)
    return this
  }
}

// 初始化可以被改变字段 - START
Statistic.debugMode = false
Statistic.HOST = '/tracer/statistic'
Statistic.userId = 0
Statistic.ProjectName = ''
Statistic.durationLength = 5000
// END

// 三种类型对应的URL
Statistic.URL = {
  duration: Statistic.HOST + '/duration',
  exam: Statistic.HOST + '/exam',
  timepoint: Statistic.HOST + '/timepoint'
}
Statistic.durationStack = [] // duration每帧的计时队列
Statistic.initialized = false // 是否已初始化
/**
 * 初始化Statistic类
 * @param settings
 * 可选参数：
 * {
 *    debugMode <Boolean> 开启调试模式
 *    HOST <String> 发送数据的主要路径
 *    userId <String> 用户ID
 *    ProjectName <String> 项目名
 *    durationLength <Number> duration发送间隔
 * }
 */
Statistic.init = function (settings) {
  Object.keys(settings).forEach((key) => {
    Statistic[key] = settings[key]
    if (key === 'HOST') {
      Statistic.URL = {
        duration: Statistic.HOST + '/duration',
        exam: Statistic.HOST + '/exam',
        timepoint: Statistic.HOST + '/timepoint'
      }
    }
  })
  Statistic.initialized = true
}
/**
 * 每帧的duration发送计算
 */
Statistic.update = function () {
  let now = +Date.now()
  let planDelete = []

  Statistic.durationStack.forEach(function (item, index) {
    if (item.running && now - item.lastTime > Statistic.durationLength) {
      item.sendData(now - item.lastTime)
      item.lastTime = now
    }

    !item.running && planDelete.push(index)
  })

  planDelete
    .sort(function (a, b) {
      return b - a
    })
    .forEach((item) => {
      Statistic.durationStack.splice(item, 1)
    })

  requestAnimationFrame(Statistic.update)
}

export default Statistic
