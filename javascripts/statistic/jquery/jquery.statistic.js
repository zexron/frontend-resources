/**
 * Author: xuning
 * Date: 2017/2/22.
 */

//重写requestAnimationFrame
(function () {
  var lastTime = 0
  var vendors = ['webkit', 'moz']
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime()
      var timeToCall = Math.max(0, 16 - (currTime - lastTime))
      var id = window.setTimeout(function () {
          callback(currTime + timeToCall)
        },
        timeToCall)
      lastTime = currTime + timeToCall
      return id
    }

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id)
    }
}());

(function ($) {
  var Statistic = function (element, options) {
    var self = this

    if (!Statistic.initialized) {
      console.warn('Statistic: not Initialized')
    }

    self.topicId = options.topic
    self.type = options.type
    self.url = Statistic.URL[options.type]
    self.element = element
    self.data = {
      topicId: self.type.substr(0, 1).toUpperCase() + self.type.substr(1) + '-' + Statistic.ProjectName + '-' + self.topicId,
      userId: Statistic.userId
    }

    self.running = false
    self.ends = true

    if (options.type == 'duration') {
      element
        .on('statistic.start', function (e) {
          e.stopPropagation()
          e.preventDefault()
          e.namespace && self.start()
        })
        .on('statistic.end', function (e) {
          e.stopPropagation()
          e.preventDefault()
          e.namespace && self.end()
        })
    } else {
      options.event && element.on(options.event, function (event, data) {
        self.sendData(data)
      })
    }

    return this
  }

// 初始化可以被改变字段 - START
  Statistic.debugMode = false
  Statistic.HOST = '/tracer'
  Statistic.userId = 0
  Statistic.ProjectName = ''
  Statistic.durationLength = 5000
// END
  Statistic.DEFAULT = {
    topicName: '',
    type: 'timepoint',
    event: ''
  }
  Statistic.URL = {
    duration: Statistic.HOST + '/statistic/duration',
    exam: Statistic.HOST + '/statistic/exam',
    timepoint: Statistic.HOST + '/statistic/timepoint'
  }
  Statistic.durationStack = []
  Statistic.initialized = false
  Statistic.init = function (settings) {
    for (var key in settings) {
      var value = settings[key]
      Statistic[key] = value
      if (key == 'HOST') {
        Statistic.URL = {
          duration: Statistic.HOST + '/statistic/duration',
          exam: Statistic.HOST + '/statistic/exam',
          timepoint: Statistic.HOST + '/statistic/timepoint'
        }
      }
    }
    Statistic.initialized = true
  }

  Statistic.prototype.sendData = function (value) {
    var self = this,
      params = '?'
    self.data.value = (value === 'now' || value === undefined || value === null) ? null : value

    for (var key in self.data) {
      var val = self.data[key]
      if (val)
        params += key + '=' + val + '&'
    }

    params = params.substr(0, params.length - 1)

    if (!Statistic.debugMode) {
      $.ajax({
        url: self.url + params,
        method: 'PUT',
        success: function (data) {
          console.log(data)
        }
      })
    } else {
      let now = new Date()
      let lastTime = self.type === 'duration' ? new Date(self.lastTime) : null
      console.groupCollapsed(self.data.topicId)
      console.info(self.type)
      console.info(self.data.value !== null ? self.data.value : `${now.getMinutes()}:${now.getSeconds()}`)
      self.type === 'duration' && console.info(`${lastTime.getMinutes()}:${lastTime.getSeconds()}-${now.getMinutes()}:${now.getSeconds()}`)
      console.groupEnd()
    }
  }

  Statistic.prototype.setTopic = function (name) {
    var self = this

    if (self.type == 'duration' && self.running == true) {
      self.end()
      self.element.one('durationEnd.statistic', function () {
        self.start()
      })
    }

    self.topicId = name
    self.data.topicId = self.type.substr(0, 1).toUpperCase() + self.type.substr(1) + '-' + Statistic.ProjectName + '-' + self.topicId

  }

// For Duration Type
  Statistic.prototype.start = function () {
    this.running = true
    this.ends = false
    this.lastTime = +Date.now()
    Statistic.durationStack.push(this)
  }

  Statistic.prototype.end = function () {
    this.running = false
    this.ends = true
    this.sendData(+Date.now() - this.lastTime)
  }

  Statistic.update = function () {
    var now = +Date.now(),
      planDelete = []

    Statistic.durationStack.forEach(function (item, index) {
      if (item.running && now - item.lastTime > Statistic.durationLength) {
        item.sendData(now - item.lastTime)
        item.lastTime = now
      }

      item.ends && planDelete.push(index)
    })

    planDelete.sort(function (a, b) {
      return a - b
    })

    for (var i = planDelete.length - 1; i >= 0; i--) {
      var deletedItem = Statistic.durationStack.splice(planDelete[i], 1)[0]
      deletedItem.element.trigger('durationEnd.statistic')
    }

    requestAnimationFrame(Statistic.update)
  }

  Statistic.update()

  function Plugin (type, option, value) {
    if (!type) {
      console.error('Statistic: Leak of parameter, "type" is needed')
      return this
    }

    type = type.toLowerCase()

    if (['timepoint', 'duration', 'exam'].indexOf(type) < 0) {
      console.error('Statistic: Wrong type parameter: "' + type + '"')
      return this
    }

    return this.each(function () {
      var $this = $(this)
      var data = $this.data('statistic.' + type)
      var options = typeof option == 'object' && option

      if (!data) {
        options = options || {
          topic: $this.data('statisticTopic'),
          event: $this.data('statisticEvent')
        }

        options.type = type

        $this.data('statistic.' + type, (data = new Statistic($this, options)))
      }
      if (typeof option == 'string') data[option](value)
    })
  }

  $.fn.statistic = Plugin
  $.fn.statistic.Constructor = Statistic
})(jQuery)
