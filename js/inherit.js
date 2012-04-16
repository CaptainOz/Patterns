
var inherit = (function(){
    function _superCaller( base, derived ){
        return function(){
            var oldSuper    = this._super;
            this._super     = base;
            var result      = derived.apply( this, arguments );
            this._super     = oldSuper;
            return result;
        };
    }

    function _overriding( name, supr, derv ){
        var func = Function;
        var suprMember = supr[name] || null;
        var dervMember = derv[name] || null;
        return
            suprMember                  &&
            dervMember                  &&
            suprMember instanceof func  &&
            dervMember instanceof func;
    }

    function _copyMembers( src, dest ){
        for( var i in src ){
            if( src.hasOwnProperty( i ) ){
                dest[i] = src[i];
            }
        }
    }
    
    function _getPrototype( clas ){
        return
            Object.getPrototypeOf ? Object.getPrototypeOf( clas ) : clas.__proto__ || new clas();
    }

    var _callsSuper = /xyz/.test( function(){ _xyz_ }).toString() ) ? /\b_super\b/ : /.*/;

    return function( base, derived ){
        // Prepare our prototypes.
        var supr  = base.prototype;
        var derv  = derived.prototype;
        var proto = _getPrototype( base );

        // Any overridden functions get a special wrapper.
        for( var name in derv ){
            var dervFunc = derv[name];
            if( _overriding( name, supr, derv ) && _callsSuper.test( dervFunc ) ){
                proto[name] = _superCaller( supr[name], dervFunc );
            }
            else {
                proto[name] = dervFunc;
            }
        }

        // Finally set the derived class' prototype.
        proto.constructor   = derived;
        derived.prototype   = proto;

        // Then create a wrapper for the constructor, copy any static members, and return it.
        var clas = _superCaller( base, derived );
        clas.prototype = _getPrototype( derived );
        _copyMembers( derived, clas );
        return clas;
    };
})();

