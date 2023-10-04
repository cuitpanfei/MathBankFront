var $ = layui.$;
var eleTree = layui.eleTree;
var ele = eleTree({
  el: "div.tree-knowledge-points",
  url: "http://localhost:8088/knowledgePoints",
  response: {
    statusName: "code",
    statusCode: 200,
    dataName: "data",
  },
  defaultExpandAll: false,
  renderAfterExpand: true,
  showCheckbox: false,
  highlightCurrent: true,
});
var renderSelect = function (url, el, handler) {
  let _handler = function (list) {
    if (handler) {
      for (var i = 0; i < list.length; i++) {
        handler(list[i]);
      }
    }
    xmSelect.render({
      el: el,
      theme: {
        color: "#2695ff",
      },
      toolbar: {
        show: true,
      },
      language: "zn",
      data: list,
    });
  };
  if (Array.isArray(url)) {
    let data = url;
    _handler(data);
  } else {
    $.get({
      url: url,
      success: function (data) {
        if (data.code == 200) {
          list = data.data;
          _handler(list);
        }
      },
    });
  }
};

layui.use(["form", "laytpl", "laypage"], function () {
  var form = layui.form;
  var laypage = layui.laypage;
  var laytpl = layui.laytpl;

  form.on("switch(multiple-checkbox-filter)", function (data) {
    var checked = data.elem.checked; // 获得 checkbox 选中状态
    ele.reload({
      showCheckbox: checked,
    });
  });

  renderSelect(
    "http://localhost:8088/questionType",
    "#questionType",
    (item) => {
      item.value = item.id;
      item.selected = true;
    }
  );
  renderSelect(
    "http://localhost:8088/question/levels",
    "#questionLevel",
    (item) => {
      item.name = item.desc;
      item.selected = true;
    }
  );
  renderSelect(
    [
      { value: 1, name: "一年级", selected: true },
      { value: 2, name: "二年级", selected: true },
      { value: 3, name: "三年级", selected: true },
      { value: 4, name: "四年级", selected: true },
      { value: 5, name: "五年级", selected: true },
      { value: 6, name: "六年级", selected: true },
    ],
    "#grade"
  );

  var pageRender = function (data, page) {
    return laypage.render({
      elem: "pageInfo", //注意，这里的 pageInfo 是 ID，不用加 # 号
      count: data.total, //数据总数，从服务端得到
      limit: data.size, //页大小，从服务端得到
      curr: location.hash.replace("#!fenye=", ""), //获取起始页
      hash: "fenye", //自定义hash值
      jump: function (obj, first) {
        //首次不执行
        if (!first) {
          //do something
          page(obj.curr, obj.limit);
        }
        var xmList = xmSelect.get();
        xmList.forEach((xm, _index) => {
          var k = xm.options.el.slice(1);
          var params = {};
          xm.update({
            on: function (vals) {
              var values = [];
              vals.arr.forEach((item, _) => {
                values.push(item.value);
              });
              params[k] = values;
              page(1, 10, params);
            },
          });
        });
      },
    });
  };
  var page = function (p, s, params) {
    var selectValues = function (id, a, defaultValues) {
      var questionTypeSelect = xmSelect.batch("#" + id, "getValue", "value");
      return (
        (a && a[id]) ||
        (questionTypeSelect.length > 0 &&
          questionTypeSelect[0].length &&
          questionTypeSelect[0]) ||
        defaultValues
      );
    };
    questionType = selectValues(
      "questionType",
      params,
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
    );
    questionLevel = selectValues("questionLevel", params, [1, 2, 3, 4, 5]);
    grade = selectValues("grade", params, [1, 2, 3, 4, 5, 6]);
    var url = "http://localhost:8088/question?p=" + p + "&s=" + s;
    var toUrl = (arr, name) =>
      $.each(arr, function (_item, key) {
        var link = "&" + name + "=" + key;
        url += link;
      });
    toUrl(questionType, "questionType");
    toUrl(questionLevel, "questionLevel");
    toUrl(grade, "grade");
    $.get({
      url: url,
      success: function (rsp) {
        $("#questioncount").text(rsp.data.total);
        var getTpl = questItem.innerHTML,
          view = $("section.test-list");
        laytpl(getTpl).render(rsp.data, function (html) {
          view.html(html);
          pageRender(rsp.data, page);
        });
      },
    });
  };
  var xmList = xmSelect.get();
  xmList.forEach((xm, _index) => {
    xm.update({
      on: function (_) {
        page(1, 10);
      },
    });
  });
  page(1, 10);
});
