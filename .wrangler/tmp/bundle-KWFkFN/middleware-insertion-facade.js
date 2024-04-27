				import worker, * as OTHER_EXPORTS from "D:\\src code\\upstash\\profanity_api\\index";
				import * as __MIDDLEWARE_0__ from "C:\\Users\\Lenovo\\.npm\\_npx\\32026684e21afda6\\node_modules\\wrangler\\templates\\middleware\\middleware-ensure-req-body-drained.ts";
import * as __MIDDLEWARE_1__ from "C:\\Users\\Lenovo\\.npm\\_npx\\32026684e21afda6\\node_modules\\wrangler\\templates\\middleware\\middleware-miniflare3-json-error.ts";
				
				worker.middleware = [
					__MIDDLEWARE_0__.default,__MIDDLEWARE_1__.default,
					...(worker.middleware ?? []),
				].filter(Boolean);
				
				export * from "D:\\src code\\upstash\\profanity_api\\index";
				export default worker;