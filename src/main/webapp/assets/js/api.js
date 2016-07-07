
function stopPropagation(){
    var e = window.event;
    e.stopPropagation();
}




//递归获取表格数据
function recursion($tr,dosomething){
    var root=[],nl,$next;
    function get($tr,parent){
        var tl = $tr.data("level");
        var temp=dosomething.call($tr);

        parent.push(temp);

        if($tr.next().length==0){
            $next=null;
            return;
        }
        nl = $tr.next().data("level");
        $next =$tr.next();
        if(tl<nl){
            temp.children=temp.children||[];
            get($next,temp.children);
        }else if(tl == nl){
            if(tl == 1){
                get($next,root);
            }else{
                get($next,parent);
            }
        }
        if($next==null){
            return;
        }
        if(nl == 1){
            get($next,root);
        }else{
            if($tr.prev().data("level")<nl){
                get($next,parent);
            }
        }
    }
    if($tr.length>0){
        get($tr,root);
    }
    return root;
}

//保存参数
function saveData(){
    api.loading();
    var $active = $("#api-edit-nav .active:not(.api-description):eq(0)");
    if($active.length>0){
        //请求参数
        var requestArgs=recursion($("#requestArgTbody tr:eq(0)"),function(){
            var temp={};
            $(this).find(".api-field").each(function(){
                var name = $(this).data("name");
                var value = $(this).val() || $(this).text() || '';
                temp[name]=value;
            });
            return temp;
        });
        //
        var responseArgs=recursion($("#responseArgTbody tr:eq(0)"),function(){
            var temp={};
            $(this).find(".api-field").each(function(){
                var name = $(this).data("name");
                var value = $(this).val() || $(this).text() || '';
                temp[name]=value;
            });
            return temp;
        });
        var json =$active.data("json");
        json=json||{};
        json = api.getJSON(json);
        //请求参数
        json.requestArgs=requestArgs;
        //响应参数
        json.responseArgs=responseArgs;
        //示例数据
        json.example=$("#api-edit-details .api-example").val();
        $active.data("json",json);
    }

    //新增数据
    //修改数据
    //删除数据
    api.loading("close");
}
//添加
$(".api-add-modal-ok").click(function(){
    var obj={};
    $(".api-field").each(function(){
        var name = $(this).attr("name");
        var value = $(this).val();
        obj[name]=value;
    });
    obj.requestMethod=$("#api-add-modal [name='requestMethod']:checked").val();
    obj.responseType=$("#api-add-modal [name='responseType']:checked").val();
    var dataType= $(this).data("type");
    if(dataType =='new'){
        var html = $("#api-item-template").html()
            .replace(/\{\{name}}/g,obj.name)
            .replace(/\{\{json}}/g,JSON.stringify(obj));
        $(window.tempdom).parent().next().append(html);
    }else{
        var $dom=$(window.tempdom).parent();
        $dom.data("json",JSON.stringify(obj));
        $dom.find("span").text(obj.name);
    }
    $(".modal-close").click();
});

var module={
    remove:function(dom){
        var $li = $(dom).parent();
        $li.remove();
        var id = $li.data("id");
        var deleteIndex;
        newdata.modules.forEach(function(d,i){
            if(d.id = id){deleteIndex=i;return true;}
        });
        newdata.modules.splice(i,1);
        newdata.apis[id]=null;
    },
    edit:function(dom){
        var $span=$(dom).prev().prev();
        $span.attr("contenteditable","true");
        $span.focus();
    },
    txtOnBlur:function(dom){
        $(dom).removeAttr("contenteditable");
        var id = $(dom).parent().data("id");
        //修改名称
        currentModule.name=$(this).text();
        newdata.modules.forEach(function (e) {
            if(e.id == id){
                d.name=currentModule.name;
            }
        });
    },
    txtOnClick:function(dom){
        var temp=$(dom).attr("contenteditable");
        if(temp){return;}
        var $li = $(dom).parent();
        if($li.hasClass("active")){
            return;
        }
        this.saveModule();
        var id = $li.data("id");

        $("#api-modules li.active").removeClass("active");
        $li.addClass("active");
        for(var i in newdata.modules){
            if(newdata.modules[i].id==id){
                currentModule = newdata.modules[i];
                break;
            }
        }
        var isEditing = $("body").hasClass("api-editing");
        if(isEditing){
            editor.apis.render();
        }else{
            apis.render();
        }
    },
    render: function(){
       var html = template('api-modules-template',{list:gdata.modules});
        $("#api-modules").html(html);
    },
    editClick:function(dom){
        $("body").addClass("api-editing");
    },
    saveClick:function(dom){
        $("body").removeClass("api-editing");
        saveData();
    },
    saveModule:function(){///保存模块
        var data =[];
        $("#api-edit-nav .api-folder").each(function(){
            var temp = {
                children:[],
                id:$(this).parent().data("id"),
                name:$(this).find("span").text()
            };
            $(this).next().find(".api-name").each(function(){
                temp.children.push(api.getJSON($(this).data("json")));
            });
            data.push(temp);
        });
        //var id=$("#api-modules .api-module-item.active").data("id");
        var id=currentModule.id;
        for(var i in newdata.modules){
            var d= newdata.modules[i];
            if(d.id == currentModule.id){
                d.host=$("#api-host").val();
                d.description=um.getContent();
                newdata.modules[i]=d;
                break;
            }
        }
        newdata.apis[currentModule.id]=data;
    }
};
//
var apis={
    render:function(){
        var html = template('api-nav-template',{list:gdata.apis[currentModule.id]});
        $("#api-nav").html(html);
        apis.folder.listenClick();
        apis.item.listenClick();
        //默认显示文档简介
        $("#api-doc-desc").show().html(api.text(currentModule.description)|| '');
        $("#lastupdatetime").text(currentModule.lastupdatetime);
    },
    folder:{
        listenClick:function(){
            $("#api-nav .api-folder").off("click").on("click",function(){
                $(this).next().slideToggle();
                $(this).toggleClass("open");
            });
        }
    },
    item:{
        listenClick:function(){
            //文档
            $("#api-view-box .api-description").off("click").on("click",function(){
                $("#api-doc-desc").show().html(api.text(currentModule.description));
                $("#api-details").hide();
            });
            //接口点击
            $("#api-view-box li li").off("click").on("click",function(){
                if($(this).find(".api-name").hasClass("active")){
                    return;
                }
                var data = api.getJSON($(this).data("json"));
                var lastupdatetime = data.lastupdatetime || '';
                $("#lastupdatetime").text(lastupdatetime);
                $("#api-doc-desc").hide();
                $("#api-nav .api-name.active").removeClass("active");
                $(this).find(".api-name").addClass("active");
                var requestArgsBody="",reqTemp=$("#api-view-details-reqtr-template").html(),responseArgsBody="",respTemp=$("#api-view-details-resptr-template").html();
                if(data.requestArgs && data.requestArgs.length>0){
                    function temp(requestData,level){
                        requestArgsBody+=reqTemp
                            .replace(/\{\{name}}/g,requestData.name || '')
                            .replace(/\{\{require}}/g,requestData.require || '')
                            .replace(/\{\{defaultValue}}/g,requestData.defaultValue || '')
                            .replace(/\{\{type}}/g,requestData.type || '')
                            .replace(/\{\{description}}/g,requestData.description || '')
                            .replace(/\{\{level}}/g,level)
                        ;
                        if(requestData.children && requestData.children.length>0){
                            requestData.children.forEach(function(d){
                                var tl = level;
                                temp(d,++tl);
                            });
                        }
                    }
                    data.requestArgs.forEach(function(d){
                        temp(d,1);
                    });
                }
                if(data.responseArgs && data.responseArgs.length>0){
                    function temp(responseData,level){
                        responseArgsBody+=respTemp
                            .replace(/\{\{name}}/g,responseData.name || '')
                            .replace(/\{\{type}}/g,responseData.type || '')
                            .replace(/\{\{description}}/g,responseData.description || '')
                            .replace(/\{\{level}}/g,level)
                        ;
                        if(responseData.children && responseData.children.length>0){
                            responseData.children.forEach(function(d){
                                var tl = level;
                                temp(d,++tl);
                            });
                        }
                    }
                    data.responseArgs.forEach(function(d){
                        temp(d,1);
                    });
                }

                data.requestArgsBody=requestArgsBody;
                data.responseArgsBody=responseArgsBody;
                data.resultData=gdata.result[data.id];
                var html=template('api-view-details-template',data);
                $("#api-details").show().html(html);
            });
        }
    },
    submitExample:function(dom,id){
        var $form=$(dom).parents("form");
        var action =$form.attr("action"),method=$form.attr("method"),responseType=$form.attr("responseType");
        if(!responseType || responseType == "application/json" || responseType=="text/plain" || responseType=="text/xml"){
            api.loading();
            $.ajax({
                url:action,
                type:method,
                complete:function(){
                    api.loading("close");
                },success:function(rs){
                    gdata.result[id] = rs;
                }
            });
        }
        return false;
    }
};
var editor={
    apis:{
        render:function(){
            var html = template('api-edit-nav-template',{list:newdata.apis[currentModule.id]});
            $("#api-edit-nav").html(html);
            //默认显示文档简介
            $("#api-edit-description").show();
            $("#api-edit-details").hide();
            um.setContent(api.text(currentModule.description));
            $("#api-host").val(currentModule.host);
        }
    },
    newApi:function(dom){ //新增api
        stopPropagation();
        $("#api-add-modal").reset().modal();
        window.tempdom= dom;
        $("#api-add-modal-ok").data("type","new");
    },
    apiDelete:function (dom){////接口-删除
        if(!confirm("是否确认删除？删除后数据不可恢复")){
            return false;
        }
        $(dom).parent().parent().remove();
    },
    apiEdit:function(dom){ //编辑
        stopPropagation();
        window.tempdom= dom;
        $("#api-add-modal").modal();
        var json = $(dom).parent().data("json");
        if(json){
            json = api.getJSON(json);
            $("#api-add-modal").fill(json);
        }
        $("#api-add-modal-ok").data("type","edit");
    },
    folderToggleSlide:function(dom){//展开
        var $dom=$(dom).parent();
        $dom.toggleClass("open");
        $dom.next().slideToggle();
    },
    turnRight:function (dom){//打开右侧
        //先保存之前的数据
        saveData();
        $("#api-edit-description").hide();
        $("#api-edit-details").show();
        var data= $(dom).parent().data("json");
        data =api.getJSON(data);
        data.description = api.text(data.description);
        //todo 填充表格参数
        
        var html = template('api-edit-details-template',data);
        $("#api-edit-details").html(html);
        $("#api-edit-nav .active").removeClass("active");
        $(dom).parent().addClass("active");
    },
    turnRightDoc: function (dom){
        //打开文档说明
        //先保存之前的数据
        saveData();
        $("#api-edit-description").show();
        $("#api-edit-details").hide();
        $("#api-edit-nav .active").removeClass("active");
        $(dom).addClass("active");
    },
    requestArgTypeChange:function (dom){//请求参数onchange
        if(dom.value=='array[object]' || dom.value=='object' ){
            $(dom).parents('tr').find('.api-add-sub').show();
        }else{
            $(dom).parents('tr').find('.api-add-sub').hide();
        }
    },
    requestArgTypeAppend: function(dom){//请求参数类型append
        var $tr = $(dom).parent().parent();
        var level = parseInt($tr.data("level")) || 1;
        var html= $("#requestArgTemplate").html().replace(/@level@/g,++level);
        /* var $next = $tr.next();
         while ($next.length>0 && parseInt($next.data("level")) == level){
         $tr= $next;
         $next = $next.next();
         }*/
        $tr.after(html);
    },
    responseArgTypeAppend:function (dom){//响应参数类型append
        var $tr = $(dom).parent().parent();
        var level = $tr.data("level") || 1;
        var html= $("#responseArgTemplate").html().replace(/@level@/g,++level);
        $tr.after(html);
    },
    removeRow:function (dom){//移除当前行
        var $tr=$(dom).parent().parent();
        var level = parseInt($tr.data("level"));
        var $next= $tr.next();
        while($next.length>0 && (parseInt($next.data("level")) || 1)>level){
            var $temp = $next;
            $next=$next.next();
            $temp.remove();
        }
        $tr.remove();
    }
};
//初始化
function init(){
    module.render();
    apis.render();
    editor.apis.render();

    //模块-新增
    $(".api-module-plus").click(function(){
        $(this).prev()
            .show()
            .focus();
        $(this).hide();
    });
//新增模块-离开
    $(".api-new-module").blur(function(){
        $(this).next().show();
        var text = $(this).text();
        $(this).hide();
        var html  =$("#api-module-template").html().replace(/\{\{name}}/g,text);
        $(this).before(html);

        var $li = $(this).parent();
        var id = $li.data("id"),isNew;
        if(!id){
            isNew=true;
            id="new_"+$("#api-modules .api-module-item").length-1;
            $li.data("id",id);
        }
        if(isNew){
            currentModule={id:id,name:$(this).text()}
            newdata.modules.push(currentModule);
        }
    });

}
