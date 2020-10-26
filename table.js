
function sbTable(id, debugLevel)
{
// Debugging levels.
	const debugNone = 0;  // means no warnings or errors.
	const debugErrors = 1;  // means alert window on error.
	const debugWarn = 2;  // means alert window on warnings and errors.

// This object has states.
	const stateInvalid = -1; //  (negative) = error state.
	const stateInit = 0; //  0 = initialised: can define columns.
	const stateAddRows = 1; //  1 = colsDefined: Can add rows.
	const stateRendered = 2; //  2 = rendered and operating.

// ColumnTypes
	const colType_string = 1;
	const colType_int = 2;
	const colType_float = 3;
	const colType_bool = 4;

// ------- Properties ---------
	this.errMsg = '';
	this.warning = '';
	this.debugLevel = debugNone;
	this.state = stateInvalid;
	this.isBorder = 1;

	this.id = '';  // Where to render the table.
	this.divId = null;  // Where to render the table.
	this.cols = [];  // definition of each column.
	this.rows = [];  // holds the rows that get rendered.

	var sortingNdx = -1;
	var obj = this;

// ------- Miscellaneous Methods ---------

	this.escapeHtml = function(unsafe)
	{	return unsafe
			 .replace(/&/g, "&amp;")
			 .replace(/</g, "&lt;")
			 .replace(/>/g, "&gt;")
			 .replace(/"/g, "&quot;")
			 .replace(/'/g, "&#039;");
	}

	this.isValidColIdent = function(name)
	{	return true;  // TODO
	}

	this.isIntRange = function(val)
	{	return true;  // TODO
	}


	this.isNum = function(str)
	// Returns true if the string 'str' is a valid floating point number.
	// Does not recognise exponential notation.
	// Returns false otherwise.
	{   var i, ch;
		var hasDot;
		var len = str.length;
 
	// Deal with possible zero length string.
		if (len == 0)
			return false;
 
	// Deal with possible single leading minus sign.
		if (len>1 && str.charAt(0)=='-')
			i = 1;
		else 
			i = 0;
 
	// Look at the remainder of the string.
		hasDot = false;
		for ( ; i<len ; i++)
		{   ch = str.charAt(i);
			if (ch>='0' && ch<='9')
				;
			else if (ch == '.')
			{   if (!hasDot)
					hasDot = true;
				else
					return false;
			}
			else
				return false;
		}
 
		return true;
	}


	this.isInt = function(str)
	// Returns true if the string 'str' is a valid integer.
	{   var i, ch;
		var len = str.length;
 
	// Deal with possible zero length string.
		if (len == 0)
			return false;
 
	// Deal with possible single leading minus sign.
		if (len>1 && str.charAt(0)=='-')
			i = 1;
		else 
			i = 0;
 
	// Check that what remains are digits.
		for ( ; i<str.length ; i++)
		{   ch = str.charAt(i);
			if (ch<'0' || ch>'9')
				return false;
		}
 
		return true;
	}
	
// ------- Error handling Methods ---------

	this.doError = function(str)
	{	if (this.debugLevel > 0)
			alert('Error in sbTable: ' + str);
		this.errMsg = str;
		this.state = -2;
		return str;
	}

	this.doWarn = function(str)
	{	if (this.debugLevel > 1)
			alert('Warning in sbTable: ' + str);
	}

// ------- Methods associated with sorting ---------

	this.compare = function(a,b)
	{	var r;
		if (a===null)
			r = -1;
		else if (b===null)
			r = 1;
		else if (a>b)
			r = 1;
		else if (a<b)
			r = -1;
		else
			r = 0;
		return r;
	}

	this.cprStr0 = function(rowa,rowb)
	{   return obj.compare(rowb[sortingNdx],rowa[sortingNdx]);
	}

	this.cprStr1 = function(rowa,rowb)
	{   return obj.compare(rowa[sortingNdx],rowb[sortingNdx]);
	}

	this.cprNum0 = function(rowa,rowb)
	{   return obj.compare(rowb[sortingNdx],rowa[sortingNdx]);
	}

	this.cprNum1 = function(rowa,rowb)
	{   return obj.compare(rowa[sortingNdx],rowb[sortingNdx]);
	}

	this.sortOnCol = function(colNdx)
	{   var col = this.cols[colNdx];
		var sndx;
		if (col.isSort)
		{   sortingNdx = colNdx;
			sndx = (col.sorterNdx+1)%2;
			col.sorterNdx = sndx;
			this.rows.sort(col.cpr[sndx]);
			this.render();
		}
	}

	// Should possibly re-write this using simpler event handling demonstrated in
	// device.js in plethy page.
	// Its kind of weird to be doing new on a function.  Is it a function or an object?
	this.evObj = function(tbl, rowNdx, colNdx)
	{   this.mother = tbl;
		this.colNdx = colNdx;
		this.rowNdx = rowNdx;
		this.handleEvent = function()
		{   if (this.rowNdx == -1 )
				this.mother.sortOnCol(this.colNdx);
			else
				this.mother.updateEdited(this.rowNdx,this.colNdx);
		}
	}

// ------- Methods associated with validation of edited fields ---------

	this.valIntObj = function(tbl)
	{   this.mother = tbl;
		this.validate = function(str)
		{	if (this.mother.isInt(str))
				return '';
			else
				return 'invalid integer';
		}
	}

	this.valNumObj = function(tbl)
	{   this.mother = tbl;
		this.validate = function(str)
		{	if (this.mother.isNum(str))
				return '';
			else
				return 'invalid number';
		}
	}

	this.updateEdited = function(rowNdx, colNdx)
	{	var col, row, id, el, val, errMsg;
		
		col = this.cols[colNdx];
		row = this.rows[rowNdx];
		id = this.id + '_' + rowNdx + '_' + colNdx;
		el = document.getElementById(id);
 
		if (col.type == colType_bool)
		{	val = el.checked;
			row[colNdx] = val;
		}
		else if (col.edValObj != null)
		{	val = el.value;
			errMsg = col.edValObj.validate(val,row);
			if (errMsg == '')
				row[colNdx] = val;
			else
			{	alert(errMsg);
				el.value = row[colNdx];
			}
		}
		else
		{	val = el.value;
			row[colNdx] = val;
		}
	}

// ------- Method to add a column ---------

	this.addCol = function(cd)
	{	var column = {};
		var href, hPos;
 
		if (this.state != stateInit)
			return this.doError("addColumn(): called when not in Init state");
 
	// name.
		if (cd.name===undefined || !this.isValidColIdent(cd.name))
			return this.doError("addColumn(): Invalid or missing identifier name");
		column.name = cd.name;
 
	// heading.
		if (cd.heading === undefined)
      column.heading = cd.name;
		column.heading = cd.heading;
 
	// type.
		if (cd.type === undefined)
			column.type = colType_string;
		else
		{	if (cd.type == 'string')
				column.type = colType_string;
			else if (cd.type == 'int')
				column.type = colType_int;
			else if (cd.type == 'float')
				column.type = colType_float;
			else if (cd.type == 'bool')
				column.type = colType_bool;
			else
				return this.doError("addColumn(): Invalid type");
		}
 
	// default value;
		if (cd.dflt===undefined || cd.dflt===null)
		{	if (column.type == colType_bool)
				column.dflt = false;
			else
				column.dflt = null;
		}
		else
			column.dflt = cd.dflt;
 
	// isHidden.
		if (cd.isHidden===undefined || !cd.isHidden)
			column.isHidden = false;
		else
			column.isHidden = true;
 
	// Is this column to be sorted?
		column.isSortDesc = 0;
		if (cd.isSort===undefined || !cd.isSort)
			column.isSort = false;
		else if (column.isHidden)
		{	this.doWarning('addColumn: Cannot sort.  Is hidden.');
			column.isSort = false;
		}
		else
		{	column.isSort = true;
			column.sorterNdx = 0;
			if (cd.cpr===null || cd.cpr===undefined)
			{	if (column.type==colType_string)
					column.cpr = [this.cprStr0,this.cprStr1];
				else if ( column.type==colType_int
						|| column.type==colType_float
						|| column.type==colType_bool
						)
					column.cpr = [this.cprNum0,this.cprNum1];
				else
					return this.doError("addColumn(): no sorter available");
			}
			else
				column.cpr = cd.cpr;
		}
 
	// Is the column a link?
		if (cd.href===undefined || cd.href===null)
			column.hrefLeft = null;
		else if (column.isHidden)
		{	this.doWarning('addColumn: Cannot be a link.  Is hidden.');
			column.hrefLeft = null;
		}
		else if (cd.hrefSub==undefined || cd.hrefSub==null)
			return this.doError("addColumn(): link requested but no substitution name");
		else
		{ // Split href into left and right for faster substitution when rendering.
			hPos = cd.href.indexOf('%');
			if (hPos<1 || hPos!=cd.href.lastIndexOf('%'))
				return this.doError('addColumn(): href does have single occurrance of "%" ');
			href = cd.href.split('%');
			column.hrefLeft = href[0];
			if (href.length == 1)
				column.hrefRight = '';
			else
				column.hrefRight = href[1];
			column.hrefSub = cd.hrefSub;
		}
 
	// Is the field editable?
		if (cd.isEditable===undefined || !cd.isEditable)
			column.isEdit = false;
		else if (column.isHidden || column.hrefLeft!=null)
		{	this.doWarning('Cannot be editable.  Is a link or is hidden.');
			column.isEdit = false;
		}
		else
		{	column.isEdit = true;
			if (cd.editValidateObj === undefined)
			{	if (column.type==colType_string || column.type==colType_bool)
					column.edValObj = null;  // No validation.
				else if (column.type == colType_float)
					column.edValObj = new this.valNumObj(this);
				else if (column.type == colType_int)
					column.edValObj = new this.valIntObj(this);
				else
					return this.doError('Internal error 1');
			}
			else
				column.edValObj = cd.editValidateObj;
		}
			
	// Add in column.
		this.cols.push(column);
		return this.errMsg;
	}

// ------- Method to end the adding of columns ---------

	this.stateAddrows = function()
	{	var jCol, iCol, col;
		var nCols = this.cols.length;
 
		if (this.state != stateInit)
			return this.doError("stateAddrows(): Not in state Init");
 
	// Pocessing for faster URL substitution.
	// For each column with a link.
		for (iCol=0; iCol<nCols; iCol++)
		{	col = this.cols[iCol];
			if (col.hrefLeft != null)
			{
			// Find the index of the field to substitute.
				col.hrefSubNdx = -1;
				for (jCol=0; jCol<nCols; jCol++)
				{	if (this.cols[jCol].name == col.hrefSub)
					{	col.hrefSubNdx = jCol;
						break;
					}
				}
				if (col.hrefSubNdx == -1)
					return this.doError("doPreUrlSubs(): Could not find column to subs into url");
			}
		}
 
	// Change the state.
		this.state = stateAddRows;
		return '';
	}

// ------- Method to add a row ---------

	this.addRow = function(arow)
	{   var row = [];
		var iCol, col;
		var val;
		var nCols = this.cols.length;
 
	// Check the state.
		if (this.state != stateAddRows)
			return this.doError('addRow(): wrong state');;
		
	// Process each column of the row.
		for (iCol=0; iCol<nCols; iCol++)
		{   col = this.cols[iCol];
			val = arow[col.name];
			if (val === undefined)
				row[iCol] = col.dflt;
			else if (val === null)
				row[iCol] = null;
			else if (col.type == colType_string)
				row[iCol] = val.toString();
			else if (col.type == colType_int)
				row[iCol] = parseInt(val,10);
			else if (col.type == colType_float)
				row[iCol] = parseFloat(val);
			else if (col.type == colType_bool)
				row[iCol] = (val != 0);
			else
				row[iCol] = val;
		 }
 
	// Finish up.
		 this.rows.push(row);
		 return '';
	}

// ------- Methods to show or refresh the table ---------

	this.renderOneVal = function(idStr, cols,iCol, row,iRow)
	// Returns the string for the contents of a single table cell.
	// On error throws a string containing the error message.
	{	var col = cols[iCol];
		var type = col.type;
		var val = row[iCol];
		var valStr, result;
 
	// Rendering for type (assigns valStr).
		if (val === null)
			valStr = '-';  
		else
		{	if (type == colType_bool)
			{   if (val)
					valStr = 'Y';
				else
					valStr = 'N';
			}
			else if (type == colType_string)
			{	valStr = this.escapeHtml(val);
			}
			else  // It is either an int or a float.
				valStr = val.toString();
		}
 
	// Editable or link (assigns result).
		if (col.isEdit)
		{	if (type == colType_bool)
			{	result = '<input type="checkbox" id="' + idStr + iCol;
				if (val)
					result += '" checked>';
				else
					result += '">';
			}
			else
			{	result = '<input type="text" id="' + idStr + iCol
						+ '" value="' + valStr + '">' ;
			}
		}
		else if (val!==null && col.hrefLeft!=null && type!=colType_bool)
		{	result = '<a href="'
				   + col.hrefLeft + row[col.hrefSubNdx] + col.hrefRight
				   + '">' + valStr + '</a>';
		}
		else
			result = valStr;
 
		return result;
	}


	this.render = function()
	{   var rowStr = '';
		var tblStr = '';
		var iRow, nRows, val, valStr;
		var iCol, col, idStr;
		var nCols = this.cols.length;
		var evObj, elTblColHdr;
 
	// Check the state.
		if (this.state==stateAddRows)
			this.state = stateRendered;
		if (this.state != stateRendered)
			return this.doError('render(): wrong state');;
 
	// Open the table.
		tblStr = '<form><table';
		if (this.isBorder)
			tblStr += ' border="1"'; 
		tblStr += '><table border="1"><thead>'; 
 
	// Add in the headings.
		idStr = this.id + '_';
		for (iCol=0; iCol<nCols; iCol++)
		{   col = this.cols[iCol];
			if (!col.isHidden)
			{	rowStr = '<th>';
				if (col.isSort)
					rowStr += '<input type="button" value="'
						   + col.heading + '" id="' + idStr + iCol + '">';
				else
					rowStr += col.heading;
				rowStr += '</th>';
				tblStr += rowStr;
			}
		}
		tblStr += '</thead><tbody>';
 
	// Add in each row.
		nRows = this.rows.length;
		for (iRow=0; iRow<nRows; iRow++)  // For each row.
		{   if (iRow%2 == 1)
				rowStr = '<tr class="odd">';
			else
				rowStr = '<tr class="even">';
			idStr = this.id + '_' + iRow + '_';
			for (iCol=0; iCol<nCols; iCol++)  // For each col not hidden.
			{	if (!this.cols[iCol].isHidden)
				{	valStr = this.renderOneVal(idStr, this.cols,iCol, this.rows[iRow],iRow);
					rowStr += '<td>' + valStr + '</td>';
				}
			}
			tblStr += rowStr + '</tr>';;
		}
 
	// Close the table.
		tblStr += '</tbody></table></form>';
 
	// Show the new table.
		this.divId.innerHTML = tblStr;
 
	// Attach event objects to the column headers of the newly displayed table.
		idStr = this.id + '_';
		for (iCol=0; iCol<nCols; iCol++)
		{	col = this.cols[iCol];
			if (!col.isHidden && col.isSort)
			{   evObj = new this.evObj(this, -1, iCol);  // It wont work without 'new'.
				elTblColHdr = document.getElementById(idStr + iCol);
				elTblColHdr.addEventListener("click", evObj, false);
			}
		}
 
	// Attach event objects to each editable table cell.
		for (iRow=0; iRow<nRows; iRow++)
		{	idStr = this.id + '_' + iRow + '_';
			for (iCol=0; iCol<nCols; iCol++)
			{	col = this.cols[iCol];
				if (col.isEdit)
				{   evObj = new this.evObj(this, iRow, iCol);  // It wont work without new.
					elTblColHdr = document.getElementById(idStr + iCol);
					elTblColHdr.addEventListener("change", evObj, false);
				}
			}
		}
 
	// return for no errors.
		return '';
	}

// ------- Methods for caller to get or update ----------------------

    this.doRowObj = function(cbFunc)
    {   this.cbFunc = cbFunc;
        this.doRow = function(rowCb)
        {   return this.cbFunc(rowCb);
        }
    }

	this.doAllRows = function(callBackObj)
	{	var iRow, nRows, row, rowCb, newRow;
		var iCol, col, nCols, isDirty;

        if (typeof callBackObj == 'function')
        {   callBackObj = new this.doRowObj(callBackObj);
		}
		
		isDirty = false;
		nCols = this.cols.length;
		nRows = this.rows.length;
		for (iRow=0; iRow<nRows; iRow++)
		{	row = this.rows[iRow];
			rowCb = {};
			for (iCol=0; iCol<nCols; iCol++)
			{	col = this.cols[iCol];
				rowCb[col.name] = row[iCol];
			}
			newRow = callBackObj.doRow(rowCb);
			if (newRow === 'delete')
			{	isDirty = true;
				this.rows.splice(iRow,1);
			}
			else if (newRow === 'modify')
			{	isDirty = true;
				for (iCol=0; iCol<nCols; iCol++)
				{	col = this.cols[iCol];
					row[iCol] = rowCb[col.name];
				}
			}
		}

		if (isDirty)
			this.render();
	}

// ------- Initialisation Code ---------

// Are we debugging?
	if (debugLevel === undefined)
		this.debugLevel = 0;  // means no warning alerts.
	else
		this.debugLevel = debugLevel;

// Get the place to construct the table.
	this.id = id;
	this.divId = document.getElementById(id);
	if (this.divId == null)
		return this.doError('Failed to find element id on page.');
		
// Finish up.
	this.state = stateInit;
}

