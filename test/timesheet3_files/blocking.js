function blocking(sAppRoot, sImage, oElements)
{
	for (var i = 0; i < oElements.length; i++) 
	{
		var oImg = null;

        if (document.all)
        {
		    if (document.all[oElements[i]]) 
		    {
			    current = document.all[oElements[i]].style.display;
			    
			    if (sImage != null) 
			    {
			        oImg=document.images[sImage];
			    }
			    
			    if(current=='block')
			    { 
				    document.all[oElements[i]].style.display = 'none';
				    if (oImg != null) 
				    {   
				        oImg.src = sAppRoot + 'images/arrow_blk_rt.gif';
				    }
			    }
			    else
			    {
				    document.all[oElements[i]].style.display = 'block';
				    if (oImg != null) 
				    {
				        oImg.src = sAppRoot + 'images/arrow_blk_dn.gif';
				    }
			    }
		    }
        }
        else if (document.getElementById)
        {
		    if (document.getElementById(oElements[i])) 
		    {
		        var current = document.getElementById(String(oElements[i])).style.display;
		  
			    if (sImage != null) 
			    {
			        oImg=document.images[sImage];
			    }
			    if (current == 'table-row') 
			    {
				    document.getElementById(oElements[i]).style.display = '';
				    if (oImg != null) 
				    { 
				        oImg.src = sAppRoot + 'images/arrow_blk_rt.gif'; 
				    }
			    }
			    else
			    {
					document.getElementById(oElements[i]).style.display = 'table-row';
    				if (oImg != null) 
    				{ 
    				    oImg.src = sAppRoot + 'images/arrow_blk_dn.gif'; 
    				}
	    		}
		    }
		}
	}
}

function toggleDisplay(sAppRoot, oElements, displayItem)
{
	for (i=0;i<oElements.length;i++) 
	{
		if (document.layers)
		{
			if (document.layers[oElements[i]]) 
			{
				if(displayItem)
					document.layers[oElements[i]].display='block';
				else
					document.layers[oElements[i]].display='none';
			}
		}
		else if(document.all)
		{
			if (document.all[oElements[i]]) 
			{
				if(displayItem)
					document.all[oElements[i]].style.display='block';
				else
					document.all[oElements[i]].style.display='none';
			}
		}
		else if(document.getElementById)
		{
			if (document.getElementById[oElements[i]]) 
			{
				if(displayItem)
					document.getElementById(oElements[i]).style.display='table-row';
				else
					document.getElementById(oElements[i]).style.display='none';
			}
		}
	}
}
