/**
 * Read-only tools this site exposes to in-browser AI agents through WebMCP
 * (document.modelContext / navigator.modelContext, feature-detected below --
 * a no-op wherever neither exists). They only read public information already
 * on the page; none of them submits the estimate form, sends email/SMS, or
 * books anything. Keep this file's tool list in sync with
 * .well-known/mcp.json's "webmcp.tools" array (this is a static site with no
 * build step, so the two are hand-kept, not generated).
 */
(() => {
  'use strict';

  var CONFIG = (typeof window !== 'undefined' && window.FLOORING_HUB_CONFIG) || {
    companyName: 'Flooring Hub',
    phone: '+13305730370',
    phoneDisplay: '(330) 573-0370',
    email: 'tsmith@flooringhubnc.com',
    social: {
      facebook: 'https://www.facebook.com/p/Flooring-Hub-61578767536673/',
      instagram: 'https://www.instagram.com/flooringhubnc/'
    }
  };

  var SITE_URL = 'https://www.flooringhubnc.com';

  // Same five services listed in index.html's schema.org offer catalog and
  // service sections -- no prices, since the site doesn't show any.
  var SERVICES = [
    'Hardwood Flooring Installation',
    'Luxury Vinyl Plank (LVP) Installation',
    'Laminate Flooring Installation',
    'Carpet Installation',
    'Hardwood Floor Refinishing'
  ];

  // Same 13 cities listed in index.html's #service-area section and schema.org areaServed.
  var SERVICE_AREA = [
    'Raleigh', 'Durham', 'Chapel Hill', 'Cary', 'Apex', 'Garner', 'Clayton',
    'Fuquay-Varina', 'Wake Forest', 'Holly Springs', 'Pittsboro', 'Hillsborough', 'Zebulon'
  ];

  var TOOLS = [
    {
      name: 'get_business_info',
      description: 'Name, phone, email, website, and social links for Flooring Hub, a flooring installation and refinishing company in the Raleigh-Durham, NC area.',
      inputSchema: { type: 'object', properties: {} },
      handle: function () {
        return {
          name: CONFIG.companyName,
          phone: CONFIG.phoneDisplay,
          email: CONFIG.email,
          url: SITE_URL,
          social: CONFIG.social,
          estimateFormUrl: SITE_URL + '/#quote',
          note: 'Estimates are free and in-home. Visitors request one themselves on the website; this tool cannot submit the form.'
        };
      }
    },
    {
      name: 'list_services',
      description: 'The flooring services Flooring Hub offers. No prices are listed -- the website does not show any, so none are returned here either.',
      inputSchema: { type: 'object', properties: {} },
      handle: function () {
        return { services: SERVICES };
      }
    },
    {
      name: 'list_service_area',
      description: 'The cities Flooring Hub serves in central North Carolina.',
      inputSchema: { type: 'object', properties: {} },
      handle: function () {
        return {
          cities: SERVICE_AREA,
          note: 'If a property is close but not listed, call ' + CONFIG.phoneDisplay + ' to ask -- coverage beyond this list is not confirmed.'
        };
      }
    }
  ];

  function asResult(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }

  function init() {
    var scope = typeof window !== 'undefined' ? window : {};
    var modelContext = (typeof document !== 'undefined' && document.modelContext) || scope.modelContext || (scope.navigator && scope.navigator.modelContext);
    if (!modelContext || typeof modelContext.registerTool !== 'function') return;

    TOOLS.forEach(function (tool) {
      try {
        modelContext.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: { readOnlyHint: true },
          execute: function () {
            return Promise.resolve(asResult(tool.handle()));
          }
        });
      } catch (err) {
        // A misbehaving or partial modelContext polyfill shouldn't break the page.
      }
    });
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
