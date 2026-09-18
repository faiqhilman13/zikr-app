import { afterEach, expect, it, vi } from 'vitest';
import { saveTextFile } from './backup';
import { isAppleMobile } from '../services/platform';
afterEach(()=>vi.restoreAllMocks());
it('recognizes an iPad desktop user agent',()=>{
  vi.spyOn(navigator,'userAgent','get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)');
  Object.defineProperty(navigator,'maxTouchPoints',{configurable:true,value:5});
  expect(isAppleMobile()).toBe(true);
});
it('returns cancellation without claiming an exported backup',async()=>{
  vi.spyOn(navigator,'userAgent','get').mockReturnValue('iPhone');
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:true}))});
  Object.defineProperty(navigator,'canShare',{configurable:true,value:vi.fn(()=>true)});
  Object.defineProperty(navigator,'share',{configurable:true,value:vi.fn().mockRejectedValue(new DOMException('cancel','AbortError'))});
  expect(await saveTextFile('backup.json','{}')).toBe(false);
});
it('surfaces share errors instead of silently falling back to an unsupported download',async()=>{
  vi.spyOn(navigator,'userAgent','get').mockReturnValue('iPhone');
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:true}))});
  Object.defineProperty(navigator,'canShare',{configurable:true,value:vi.fn(()=>true)});
  Object.defineProperty(navigator,'share',{configurable:true,value:vi.fn().mockRejectedValue(new DOMException('gesture expired','NotAllowedError'))});
  await expect(saveTextFile('backup.json','{}')).rejects.toThrow();
});
