
var is = (function(){
    function _allInstancesOf( items, clas ){
        for( var i = 0; i < items.length; ++i ){
            if( !(items[i] instanceof clas) ){
                return false;
            }
        }
        return true;
    }

    return {
        Array : function(){
            return _allInstancesOf( arguments, Array );
        },

        Function : function(){
            var args = arguments;
            for( var i = 0; i < args.length; ++i ){
                var item = args[i];
                if( !(item instanceof Function) && !(/^function\b/.test( item.toString() )) ){
                    return false;
                }
            }
            return true;
        },

        InstanceOf : function(){
            var args = [];
            args.push.apply( args, arguments );
            var clas = args.pop();
            return _allInstancesOf( args, clas );
        },

        Number : function(){
            return _allInstancesOf( arguments, Number );
        },

        Numeric : function(){
            var args = arguments;
            for( var i = 0; i < args.length; ++i ){
                if( isNaN( args[i] ) ){
                    return false;
                }
            }
            return true;
        },

        String : function(){
            return _allInstancesOf( arguments, String );
        }
    };
})();

