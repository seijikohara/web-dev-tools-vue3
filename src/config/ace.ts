import ace from 'ace-builds'
import workerJsonUrl from 'ace-builds/src-noconflict/worker-json?url'
import workerJavascriptUrl from 'ace-builds/src-noconflict/worker-javascript?url'
import workerHtmlUrl from 'ace-builds/src-noconflict/worker-html?url'
import workerCssUrl from 'ace-builds/src-noconflict/worker-css?url'

ace.config.setModuleUrl('ace/mode/json_worker', workerJsonUrl)
ace.config.setModuleUrl('ace/mode/javascript_worker', workerJavascriptUrl)
ace.config.setModuleUrl('ace/mode/html_worker', workerHtmlUrl)
ace.config.setModuleUrl('ace/mode/css_worker', workerCssUrl)
