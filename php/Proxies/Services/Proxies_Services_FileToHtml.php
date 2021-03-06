<?php

/*
 * Copyright (c) 2014 - Copyright holders CIRSFID and Department of
 * Computer Science and Engineering of the University of Bologna
 *
 * Authors:
 * Monica Palmirani – CIRSFID of the University of Bologna
 * Fabio Vitali – Department of Computer Science and Engineering of the University of Bologna
 * Luca Cervone – CIRSFID of the University of Bologna
 *
 * Permission is hereby granted to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The Software can be used by anyone for purposes without commercial gain,
 * including scientific, individual, and charity purposes. If it is used
 * for purposes having commercial gains, an agreement with the copyright
 * holders is required. The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * Except as contained in this notice, the name(s) of the above copyright
 * holders and authors shall not be used in advertising or otherwise to
 * promote the sale, use or other dealings in this Software without prior
 * written authorization.
 *
 * The end-user documentation included with the redistribution, if any,
 * must include the following acknowledgment: "This product includes
 * software developed by University of Bologna (CIRSFID and Department of
 * Computer Science and Engineering) and its authors (Monica Palmirani,
 * Fabio Vitali, Luca Cervone)", in the same place and form as other
 * third-party acknowledgments. Alternatively, this acknowledgment may
 * appear in the software itself, in the same form and location as other
 * such third-party acknowledgments.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

require_once('utils.php');

class Proxies_Services_FileToHtml implements Proxies_Services_Interface
{
	private $_filePath;
	private $_fileSize;
	private $_fileName;

    private $cleaningXsl = CLEAN_CONVERTED_HTML;
    private $cleaningXslDom;
	private $xmlMime = "application/xml";
	private $akn20Namespace = "http://www.akomantoso.org/2.0";
	private $akn30Namespace = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD05";

	/**
	 * The constructor of the service
	 * @return the service object
	 * @param Array the params that are passed to the service
	 */
	public function __construct($params)
	{
		$this->_delete = FALSE;
		if (isset($_FILES['file'])
	        && $_FILES['file']['error'] == UPLOAD_ERR_OK               //checks for errors
		    && is_uploaded_file($_FILES['file']['tmp_name'])) { //checks that file is uploaded
		  		$this->_filePath = $_FILES['file']['tmp_name'];
				$this->_fileName = $_FILES['file']['name'];
				$this->_fileSize = $_FILES['file']['size'];
		} else if (isset($params['fileExistPath']) && $params['fileExistPath']) {
			// Crappy code to allow to specify file url.
			$url = EXIST_URL.'rest'.$params['fileExistPath'];
			$this->_fileName = str_replace("/", "__", $params['fileExistPath']);
	  		$this->_filePath = dirname(__FILE__)."/../../tmp/".$this->_fileName;
			file_put_contents($this->_filePath, fopen($url, 'r'));
			$this->_delete = TRUE;
			$this->_fileSize = 42;
		}
		$this->_transformFile = (isset($params['transformFile']) && $params['transformFile']) ? realpath(LIMEROOT."/".$params['transformFile']) : FALSE;
		$this->_cleanXslCustom = (isset($params['cleanXsl']) && $params['cleanXsl']) ? $params['cleanXsl'] : FALSE;
		$this->loadCleaningXsl($this->_cleanXslCustom);
	}

	private function loadCleaningXsl($xsl=FALSE) {
		$xsl = $xsl ?: $this->cleaningXsl;
		$this->cleaningXslDom = new DOMDocument();
		$this->cleaningXslDom->load($xsl);
	}

	/**
	 * this method is used to retrive the result by the service
	 * @return The result that the service computed
	 */
	public function getResults()
	{
		$output = Array();
		if (isset($this->_filePath) && isset($this->_fileSize)) {
			$fileType = $this->getFileType();
            // Check if the type of the given document is supported
            if ($fileType === $this->xmlMime) {
            	$doc = new DOMDocument();
            	$xmlString = file_get_contents($this->_filePath);
				if ($doc->loadXML($xmlString)) {
					if ( $this->_transformFile ) {
						$result = aknToHtml($doc, $this->_transformFile, FALSE, TRUE);
						$output['markinglanguage'] = $result["markinglanguage"];
						$resultXml = $result["xml"];
					} else {
						$resultXml = "";
					}

					if ($resultXml) {
						$output['success'] = true;
						$output['marked'] = true;
						$output['html'] = $resultXml;
						$output['xml'] = utf8_encode($xmlString);
					} else {
						$output['success'] = false;
						$output['html'] = "Unable to transform XML file";
					}
				} else {
					$output['success'] = false;
					$output['html'] = "Unable to load XML file";
				}
            } else if ($this->isTypeAllowed($fileType)) {
				$tmpDir = dirname($this->_filePath);
				// ini_get('upload_tmp_dir');
				$fileName = "conv_".basename($this->_filePath);
				$filePath = tempnam($tmpDir, "cnv");
				$cmd = ABIWORD_PATH.' --to=html '.$this->_filePath.' -o '.$filePath;
				exec($cmd);
				$htmlSource = file_get_contents($filePath);
				$output['html'] = $this->cleanHtml($htmlSource);
				if ($this->_fileSize && (strlen($output['html']) == 0)) {
					$output['success'] = false;
				} else {
					$output['success'] = true;
				}
				unlink($filePath);
			} else {
				$output['success'] = false;
				$output['html'] = $fileType." files are not supported";
			}
		} else {
			$output['success'] = false;
			$output['filePath'] = $this->_filePath;
			$output['fileName'] = $this->_fileName;
		}

		if(array_key_exists('html', $output) && strlen($output['html'])) {
			$lang = detectLanguage($output['html'], 3);
			if($lang) {
				$output['language'] = $lang;
			}
		}

		if ($this->_delete) unlink($this->_filePath);
		return str_replace('\/','/',json_encode($output));
	}

    /**
     * Clean the given html by using a pre-defined xsl
     * stylesheet.
     * @param {String} $htmlSource The html string
     * @return {String} The cleaned html string
     */
    private function cleanHtml($htmlSource){
    	// Replace all non breaking spaces with spaces
    	$htmlSource = str_replace(chr(0xC2).chr(0xA0), " ", $htmlSource);
    	// Replace the END OF GUARDED AREA with -
        $htmlSource = str_replace("&#151;", "-", $htmlSource);

        // Build XSLT
        $xslt = new XSLTProcessor();
        $xslt->importStylesheet($this->cleaningXslDom);
        $htmlDom = new DOMDocument();
        libxml_use_internal_errors(true);
        $htmlDom->loadHTML($htmlSource);
        libxml_use_internal_errors(false);
        $result = $xslt->transformToXML($htmlDom);

    	$result = str_replace("&#160", " ", $result);
    	$result = str_replace("&#xa0", " ", $result);
    	$result = str_replace("&nbsp", " ", $result);
    	$result = str_replace(" ", " ", $result);
    	$result = str_replace(chr(0xC2).chr(0xA0), " ", $result);
        return $result;
    }

	private function isTypeAllowed($mime) {
		$allowedTypes = array("text/html", "application/msword", "application/pdf", "application/vnd.oasis.opendocument.text", "text/plain",
							   "application/rtf","text/rtf","application/vnd.ms-office", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
		$docxExtension = ".docx";
		$fileExtension = (false === $pos = strrpos($this->_fileName, '.')) ? '' : substr($this->_fileName, $pos);

		if ($mime === "application/zip" && $fileExtension==$docxExtension) {
			return true;
		}

		return in_array($mime, $allowedTypes);
	}

	private function getFileType() {
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		return finfo_file($finfo, $this->_filePath);
	}
}
?>
