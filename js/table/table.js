
/// Table - Configurable table class.
///
/// @todo   Currently tables with scrollbars have poor alignment on systems where the scrollbar is
///         not zero-width.
///
/// @par Options Object
///  - headers
///    - An array of column definitions describing the columns to display.
///  - data
///    - An array of objects containing the data to display.
///  - callbacks
///    - An object for row-level event callbacks. The keys are the names of the events.
///  - selectable
///    - Boolean flag indicating if rows should be selectable. Default is true.
///  - scrollable
///    - Boolean flag indicating if the table body should scroll. Default is false.
///  - pinToBottom
///    - Number of pixels from the bottom to pin the table. Default is false (do not pin).
///
/// @par Column Definitions
/// - name
///   - The name of the column from the data to use for the cell.
/// - title
///   - The name of the column as it will appear in the table header.
/// - generator
///   - The cell generation function.
/// - sort
///   - The type of sorting to use, or false to disable sorting on this column.
/// - filter
///   - A function to filter the data through before displaying it.
///
/// @par Special Columns
/// There are a few special column definitions that can be used by specifying them as the 'name'
/// part of a column definition.
///  - Table.rowIDColumn
///    - A column containing the row ID for the data. This is an incrementing ID uniquely given to
///      each row.
///
/// @par Cell Generators
/// For each cell in a column the cell generator is called. It is passed, in order, the name
/// of the cell, the data object for the row, the table being constructed, and the filter for
/// the column. There are a few pre-built generators. The default generator is Table.textCell.
///  - Table.buttonCell
///    - Creates a cell containing a button.
///  - Table.toggleButtonCell
///    - Creates a cell containing a toggleable button.
///  - Table.linkCell
///    - Creates a cell containing a clickable link-like element.
///  - Table.progressBarCell
///    - Creates a cell containing a progress bar.
///  - Table.textCell
///    - Creates a cell containing static text. This is the default.
///
/// @par Sort Methods
/// Whenever a column is clicked for sorting this function is called to sort the data in the
/// table. The function is passed the name of the column to compare on and the two rows of data
/// to compare. There are a few pre-built sorting methods, of which the default is
/// Table.caseInsensitiveSort.
///  - Table.numberSort
///    - Sorts the data as numbers.
///  - Table.stringSort
///    - Sorts the data as strings.
///  - Table.booleanSort
///    - Sorts the data as boolean values (true over false).
///  - Table.caseInsensitiveSort
///    - Sorts the data as strings, ignoring capitalization.
///  - Table.reverseSort
///    - Reverses the order of sorting. This is a sort generator, the sorting algorithm should
///      be passed as the first parameter.
///
/// @par Filter Methods
/// Filters are used on the data before displaying it. They can be used to manipulate the cell
/// data in any way. Only the data for the cell is passed into the function, and the return
/// value will be put in the cell.
///  - Table.dateFilter
///    - Parses the data as a date and reformats it.
///  - Table.combineFilters
///    - Applies all of the filters passed as arguments in the order they are passed in.
///
/// @par Click Callbacks
/// Many of the pre-built cell generators take a click callback as the first parameter. This
/// callback should have the following declaration:
///     function( name, data, table [, button [, toggled ]], event )
///
/// The parameters are as follows:
///  - name
///    - The "name" field from the column's header declaration.
///  - data
///    - The data object for the row the cell is in.
///  - table
///    - The Table object the cell belongs to.
///  - button (only for Table.buttonCell and Table.toggleButtonCell)
///    - The HTML element that was clicked.
///  - toggled (only for Table.toggleButtonCell)
///    - Flag indicating if the button is toggled on.
///  - event
///    - The JavaScript event object.
///
/// @par Row Event Callbacks
/// Events on the table rows can be bound to using the rowCallback configuration option. Any normal
/// JavaScript event can be bound to.
var Table = (function(){
    /// Constructs a new table.
    ///
    /// @param element  An element or a selector which the table will be put in.
    /// @param opts     An options object describing the format of the table.
    function Table( element, opts ){
        $( window ).on( 'resize', _onWindowResized.bind( this ) );
        this._config = $.extend( true, {}, DEFAULT_TABLE_CONFIG );
        this._callbacks = {};
        if( element ){
            this.setElement( element );
        }
        if( opts ){
            this.setOpts( opts );
        }
    }
    var TableProto = Table.prototype;

    /// Creates a button generator function.
    ///
    /// @param callback Function to call when the button is clicked.
    /// @param iconName An alternate class name to give the button instead of the column's name.
    ///
    /// @return A function for generating icon button cells.
    Table.buttonCell = function( callback, iconName ){
        var firstCall = true;
        return function( name, data, table, filter ){
            if( firstCall ){
                table._element.on(
                    'click',
                    '.column.' + name + ' .button',
                    _columnCallback.bind( table, name, callback )
                );
                firstCall = false;
            }

            var button = BUTTON_CELL.clone();
            button.addClass( iconName || name );
            return button;
        };
    };

    /// Creates a toggle button generator function.
    ///
    /// @param callback Function to call when the button is toggled on or off.
    /// @param iconName An alternate class name to give the button instead of the column's name.
    ///
    /// @return A function for generating togglable icon button cells.
    Table.toggleButtonCell = function( callback, iconName ){
        var buttonCellGenerator = Table.buttonCell(
            function( name, data, table, button ){
                button.toggleClass( ACTIVE_CLASS );
                callback( name, data, table, button, button.hasClass( ACTIVE_CLASS ) );
            },
            iconName
        );
        return function( name, data, table, filter ){
            var button = buttonCellGenerator( name, data, table );
            if( data[ name ] ){
                button.addClass( ACTIVE_CLASS );
            }
            return button;
        };
    };

    /// Creates a link generator function.
    ///
    /// @param callback A function to call when the link is clicked.
    ///
    /// @return A function to generate link cells.
    Table.linkCell = function( callback ){
        var firstCall = true;
        return function( name, data, table, filter ){
            if( firstCall ){
                table._element.on(
                    'click',
                    '.column.' + name + ' .link',
                    _columnCallback.bind( table, name, callback )
                );
                firstCall = false;
            }

            var link = LINK_CELL.clone();
            link.addClass( name );
            link.text( filter( data[ name ] ) );
            return link;
        };
    };

    /// Creates a progress bar generator function.
    ///
    /// @param max The maximum value for the progress bar. This is used to scale the bar.
    ///
    /// @return A function to generate progress bar cells.
    Table.progressBarCell = function( max ){
        return function( name, data, table ){
            var progressBar = PROGRESS_BAR.clone();
            if( !isNaN( data[ name ] ) ){
                var fillPercent = (data[ name ] / max * 100).toFixed();
                progressBar.find( 'div.fill' ).css( 'width', fillPercent + '%' );
            }
            return progressBar;
        };
    };

    /// Create a straight text generator function.
    ///
    /// @return A function to generate plain text cells.
    Table.textCell = function(){
        return function( name, data, table, filter ){
            return filter( data[ name ] );
        };
    };

    /// A numerical comparator.
    ///
    /// @param column   The name of the column to compare.
    /// @param a        The left hand object.
    /// @param b        The right hand object.
    ///
    /// @return Less than zero if a is less than b, greater than zero if a is greater than b, or
    ///         equal to zero if a and b are equal.
    Table.numberSort = function( column, a, b ){
        var numA = Number( a[ column ] ) || 0;
        var numB = Number( b[ column ] ) || 0;
        return numA - numB;
    };

    /// A string comparator.
    ///
    /// @param column   The name of the column to compare.
    /// @param a        The left hand object.
    /// @param b        The right hand object.
    ///
    /// @return Less than zero if a is less than b, greater than zero if a is greater than b, or
    ///         equal to zero if a and b are equal.
    Table.stringSort = function( column, a, b ){
        var aData = String( a[ column ] );
        var bData = String( b[ column ] );
        return  aData < bData ? -1 :
                aData > bData ?  1 :
                                 0 ;
    };

    /// A case insensitive string comparator.
    ///
    /// @param column   The name of the column to compare.
    /// @param a        The left hand object.
    /// @param b        The right hand object.
    ///
    /// @return Less than zero if a is less than b, greater than zero if a is greater than b, or
    ///         equal to zero if a and b are equal.
    Table.caseInsensitiveSort = function( column, a, b ){
        var aData = String( a[ column ] ).toLowerCase();
        var bData = String( b[ column ] ).toLowerCase();
        return  aData < bData ? -1 :
                aData > bData ?  1 :
                                 0 ;
    };

    /// A boolean comparator, true over false.
    ///
    /// @param column   The name of the column to compare.
    /// @param a        The left hand object.
    /// @param b        The right hand object.
    ///
    /// @return Less than zero if a is less than b, greater than zero if a is greater than b, or
    ///         equal to zero if a and b are equal.
    Table.booleanSort = function( column, a, b ){
        return Boolean( b[ column ] ) - Boolean( a[ column ] );
    };

    /// Reverses the sort order of the given comparator.
    ///
    /// @param sortFunc The function to reverse the comparison of.
    ///
    /// @return A function reversing the comparision of sortFunc.
    Table.reverseSort = function( sortFunc ){
        return function( column, a, b ){
            return sortFunc( column, b, a );
        };
    };

    /// Creates a filter function that will reformat dates as specified.
    ///
    /// @param outFormat    The desired date format.
    /// @param inFormat     (Optional) The format the data is in.
    ///
    /// @return The filter function.
    Table.dateFilter = function( outFormat, inFormat ){
        return function( data ){
            var date = inFormat ? Date.parseExact( data, inFormat ) : Date.parse( data );
            return date ? date.toString( outFormat ) : data;
        };
    };

    /// Creates a function which will apply all of the given filters in the order they are given.
    ///
    /// @parma filters... The filters to apply.
    ///
    /// @return A function which applies all of the filters to any data passed in.
    Table.combineFilters = function(){
        var filters = Array.prototype.slice.call( arguments );
        return function( data ){
            for( var i in filters ){
                data = filters[ i ]( data );
            }
            return data;
        };
    };

    Table.rowIDColumn = '_table_rowID';

    var TABLE_TEMPLATE = $(
        '<table class="pl-table"><thead><tr></tr></thead><tbody></tbody></table>'
    );
    var DEFAULT_TABLE_CONFIG = {
        'selectable'    : false,
        'scrollable'    : false,
        'pinToBottom'   : false
    };
    var DEFAULT_COLUMN_CONFIG = {
        'generator' : Table.textCell(),
        'filter'    : String,
        'sort'      : Table.caseInsensitiveSort
    };
    var ACTIVE_CLASS        = 'active';
    var INSERT_BATCH_LIMIT  = 500;
    var MIN_TABLE_HEIGHT    = 110;
    var BUTTON_CELL     = $( '<div class="icon button"></div>' ).detach();
    var LINK_CELL       = $( '<span class="link"></span>' ).detach();
    var PROGRESS_BAR    = $( '<div class="progress-bar"><div class="fill"></div></div>' ).detach();

    function _noBubbleBind( element, event, callback ){
        element.on(
            event,
            function( eventObj ){
                eventObj.stopPropagation();
                callback.apply( this, arguments );
            }
        );
    }

    function _setHeaders( headers ){
        // Add default options to each header.
        for( var i in headers ){
            headers[ i ] = $.extend( {}, DEFAULT_COLUMN_CONFIG, headers[ i ] );
        }

        this._headers = headers;
        this._table = null;
    }

    function _setCallbacks( callbacks ){
        this._callbacks = $.extend( {}, this._callbacks, callbacks );
    }

    function _setData( data ){
        this._data = [];
        for( var i = 0; i < data.length; ++i ){
            var datum = $.extend( {}, data[ i ] );
            datum[ Table.rowIDColumn ] = i + 1;
            this._data.push({ row : null, data : datum });
        }
        this._table = null;
    }

    function _updateTable(){
        // Build the table object.
        var header          = TABLE_TEMPLATE.clone();
        var body            = TABLE_TEMPLATE.clone();
        var bodyContainer   = $( '<div class="pl-table-body-container"></div>' );
        this._bodyTable     = body;
        this._headerTable   = header;
        header.addClass( 'header' );
        body.addClass( 'body' );
        bodyContainer.append( body );

        // Insert the tables into the DOM.
        this._element
            .empty()
            .append( header )
            .append( bodyContainer );

        // Add in the table headers.
        var theadRow = header.find( 'thead tr' );
        for( var i in this._headers ){
            // Make the cell
            var header = this._headers[ i ];
            var elem = $( '<th class="column header"></th>' );
            elem.addClass( header.name );

            if( header.sort ){
                _addSortControls.call( this, header.name, elem, header.sort );
            }
            if( header.title ){
                elem.html( header.title );
            }
            if( header.colspan ){
                elem.prop( 'colspan', header.colspan.length );
            }

            theadRow.append( elem );
        }

        if( this._config.scrollable ){
            bodyContainer.addClass( 'scrollable' );
        }

        if( this._data && this._data.length ){
            _insertData.call( this, 0 );
        }

        _bindRowEvent.call( this, 'click', body );
        _bindRowEvent.call( this, 'dblclick', body );
    }

    function _insertData( start ){
        var tbody = this._bodyTable.find( 'tbody' );
        var i = 0;
        for( ; i < INSERT_BATCH_LIMIT && start + i < this._data.length; ++i ){
            // Get the data and create a new row if it doesn't exist yet.
            var datum = this._data[ start + i ];
            if( !datum.row ){
                var row = $( '<tr></tr>' ).detach();

                // Go through all the columns in the headers array and build the cells.
                for( var j in this._headers ){
                    var header = this._headers[ j ];
                    var cellName = header.name;
                    var cell = _createCell.call( this, cellName, datum.data, header );
                    row.append( cell );
                }
                datum.row = row;
            }
            else {
                datum.row.detach();
            }
            datum.row.data( 'data', datum );
            datum.row.appendTo( tbody );
        }

        // Just append one item to the header so it gets correct sizing. It must be a clone so we
        // don't move the row from the visible table body.
        this._headerTable.find( 'tbody' ).append( this._data[ start ].row.clone() );

        if( start + i < this._data.length ){
            setTimeout( _insertData.bind( this, start + i ), 0 );
        }
    }

    function _createCell( cellName, datum, header ){
        // Create the cell.
        var cell = $( '<td class="column"></td>' );
        cell.addClass( cellName );
        cell.data( 'name', cellName );

        // Insert the data.
        var inner = header.generator( cellName, datum, this, header.filter );
        if( typeof inner == "string" ){
            cell.html( inner );
        }
        else {
            cell.append( inner );
        }
        return cell;
    }

    function _addSortControls( column, elem, sortMode ){
        var self = this;
        elem.addClass( 'sortable' );
        elem.click( this.sortOnColumn.bind( this, column, sortMode ) );
    }

    function _bindRowEvent( event, bodyTable ){
        bodyTable.on( event, 'tr', _onRowEvent.bind( this, event ) );
    }

    function _onRowEvent( eventName, event ){
        var $target = $( event.target );
        if( !$target.is( 'td' ) && !$target.is( 'tr' ) ){
            return;
        }
        var $row = $target.closest( 'tr' );

        // If this was a click event, update the row selection.
        if( eventName == 'click' ){
            this._element.find( 'tr.selected' ).removeClass( 'selected' );
            $row.addClass( 'selected' );
        }
        if( this._callbacks[ eventName ] ){
            this._callbacks[ eventName ]( $row.data( 'data' ).data, $row, this );
        }
    }

    function _onWindowResized(){
        var bottomOffset = Number( this._config.pinToBottom );
        if( !bottomOffset ){
            return;
        }
        var $container  = this._bodyTable.closest( '.lw-table-body-container' );
        var newHeight   = $( window ).height() - $container.offset().top - Number( bottomOffset );
        $container.height( newHeight > MIN_TABLE_HEIGHT ? newHeight : MIN_TABLE_HEIGHT );
    }

    function _columnCallback( column, callback, event ){
        var $button = $( event.target );
        var $cell   = $button.closest( 'td' );
        var $row    = $cell.closest( 'tr' );
        event.stopPropagation();
        callback.call( this, $cell.data( 'name' ), $row.data( 'data' ).data, this, $button );
    }

    function _mergeConfig( config ){
        $.extend( true, this._config, config );
    }

    /// Sets the element in which the table will live.
    ///
    /// @param element Either a selector or an HTMLElement to put the table in.
    TableProto.setElement = function( element ){
        this._element = $( element );
        if( !this._element ){
            throw new Error( "Bad target element: " + element );
        }
    };

    /// Sets the options for the table.
    ///
    /// @param opts The options object to set.
    TableProto.setOpts = function( opts ){
        if( opts.headers ){
            _setHeaders.call( this, opts.headers );
            delete opts.headers;
        }
        if( opts.callbacks ){
            _setCallbacks.call( this, opts.callbacks );
            delete opts.callbacks;
        }

        // Lastly, set the data if we have it.
        if( opts.data ){
            _setData.call( this, opts.data );
            delete opts.data
        }
        _mergeConfig.call( this, opts );
        _updateTable.call( this );
        _onWindowResized.call( this );
    };

    /// Sets the headers.
    ///
    /// @param headers The new header definitions to use.
    TableProto.setHeaders = function( headers ){
        _setHeaders.call( this, headers );
        _updateTable.call( this );
    };

    /// Sets the data.
    ///
    /// @param data The new data to load into the table.
    TableProto.setData = function( data ){
        _setData.call( this, [].concat( data ) );
        _updateTable.call( this );
        _onWindowResized.call( this );
    };

    /// Rebuilds the table using the already loaded data.
    TableProto.rebuild = function(){
        this._table = null;
        for( var i in this._data ){
            this._data[ i ].row = null;
        }
        _updateTable.call( this );
    };

    /// Retrieves the HTMLTableElement built by this Table.
    ///
    /// @return The HTMLTableElement.
    TableProto.getHTMLTable = function(){
        return this._bodyTable;
    };

    /// Sorts the data on the given column using the provided sort method.
    ///
    /// @param column   The column to sort on.
    /// @param sortMode The comparator function to use for sorting.
    TableProto.sortOnColumn = function( column, sortMode ){
        // Figure out our sorting function.
        var cellSelector = '.header.column.' + column;
        var descend = this._headerTable.find( cellSelector ).hasClass( 'ascending-sort' );
        if( descend ){
            sortMode = Table.reverseSort( sortMode );
        }

        // Sort the data and update the table.
        this._data = this._data.sort( function( a, b ){
            return sortMode( column, a.data, b.data );
        });
        _updateTable.call( this );

        // Update the header's class.
        var header = this._headerTable.find( cellSelector );
        if( descend ){
            header.removeClass( 'ascending-sort' );
            header.addClass( 'descending-sort' );
        }
        else {
            header.addClass( 'ascending-sort' );
            header.removeClass( 'descending-sort' );
        }
        _onWindowResized.call( this );
    };

    return Table;
})();

