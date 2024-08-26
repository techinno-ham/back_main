import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class CrawlerService {
  constructor(@Inject('KAFKA_SERVICE') private readonly client: ClientKafka) {}

 
  async getavailableLink(url: string) {
    try {
      const response = await axios.get(url);
      const bodyHTML = response.data;
      const $ = cheerio.load(bodyHTML);
      const links = $('a');
      const allFoundURLs = [];
      $(links).each(function (i, link) {
        let href = $(link).attr('href');
        if (href[0] === '/') {
          // useful for scenarios t==hat have / at the end of string
          const urlWithoutSlash = href.substring(1);
          href = url + href;
        }
        allFoundURLs.push(href);
      });

      const uniqueURLs = [...new Set(allFoundURLs)];

      return uniqueURLs;
    } catch (err) {
      console.log(err);
    }
  }

  async getAvailableLinksDemo(url: string) {
    try {

      const baseURL = new URL(url).origin;

      if (url === baseURL) {
         const sitemapURLs = await this.getSitemapURLs(baseURL);

         if( sitemapURLs.length > 2 ){
          console.log("here")
            return  await this.getAvliableLinkSiteMap(sitemapURLs,url);
         }else{
          return  await this.getAvliableLinkCherio(url);
         }
        
      } else {
           return  await this.getAvliableLinkCherio(url);
      }

    } catch (err) {
      console.log(err);
      throw new Error('Failed to fetch and parse URLs');
    }
  }


  async getAvliableLinkCherio(url: string){
      const response = await axios.get(url);
      const bodyHTML = response.data;
      const $ = cheerio.load(bodyHTML);
      const links = $('a');
      const allFoundURLs: string[] = [];
      const baseURL = new URL(url).origin;
  
      // Get base URL to use for relative URLs
  
      $(links).each(function (i, link) {
        let href = $(link).attr('href');
  
        if (href) {
          if (href.startsWith('/')) {
            href = baseURL + href;
          }
  
          if (href.startsWith(baseURL)) {
            allFoundURLs.push(href);
          }
        }
      });
  
      // Remove duplicates and limit to a maximum of 10 unique URLs
      let uniqueURLs = [...new Set(allFoundURLs)].slice(0, 10);
  
      // Ensure the original URL is included
      if (!uniqueURLs.includes(url)) {
        uniqueURLs.unshift(url);
        if (uniqueURLs.length > 10) {
          uniqueURLs.pop(); // Ensure the list doesn't exceed 10 URLs
        }
      }
  
      // Create an array to store the URLs with their character counts
      const urlCharacterCounts: { url: string; characterCount: number }[] = [];
  
      // Crawl each unique URL and calculate the character count
      for (const uniqueURL of uniqueURLs) {
        const characterCount = await this.getCharacterCount(uniqueURL);
        urlCharacterCounts.push({ url: uniqueURL, characterCount });
      }
  
      // Sort the URLs by character count in descending order
      const sortedURLs = urlCharacterCounts.sort((a, b) => b.characterCount - a.characterCount);
  
      // Ensure the primary URL is included
      const primaryURLData = sortedURLs.find(item => item.url === url);
      if (!primaryURLData) {
        const primaryCharacterCount = await this.getCharacterCount(url);
        sortedURLs.unshift({ url, characterCount: primaryCharacterCount });
      }
    
      // Adjust selection to satisfy the character count range
      let selectedURLs = [];
      let totalCharacterCount = 0;
      const minCharacterCount = 6000;
      const maxCharacterCount = 25000;
  
      // Add primary URL first
      selectedURLs.push(primaryURLData);
      totalCharacterCount = primaryURLData.characterCount;
  
      for (const urlData of sortedURLs) {
        if (urlData.url === url) {
          continue;
        }
  
        // Check if adding the next URL keeps the total within the 25,000 character limit
        if (totalCharacterCount + urlData.characterCount > maxCharacterCount) {
          continue;
        }
  
        selectedURLs.push(urlData);
        totalCharacterCount += urlData.characterCount;
  
        // If the total character count is within the range and we've added 4 or 5 URLs, stop adding more
        if (totalCharacterCount >= minCharacterCount && selectedURLs.length >= 4) {
          break;
        }
      }
  
      // If the total character count is still less than the minimum, try to add more URLs
      if (totalCharacterCount < minCharacterCount) {
        for (const urlData of sortedURLs) {
          if (!selectedURLs.includes(urlData) && totalCharacterCount + urlData.characterCount <= maxCharacterCount) {
            selectedURLs.push(urlData);
            totalCharacterCount += urlData.characterCount;
            if (totalCharacterCount >= minCharacterCount) {
              break;
            }
          }
        }
      }
  
      // If the total character count is still less than the minimum after trying to add more URLs, throw an error
      if (totalCharacterCount < minCharacterCount) {
        throw new Error(`Unable to find enough content. The total character count is less than the required minimum of ${minCharacterCount} characters.`);
      }
  
      // Ensure the selected URLs list has a maximum of 4 links
      if (selectedURLs.length > 4) {
        selectedURLs = selectedURLs.slice(0, 4);
      }
  
      return selectedURLs.map((item) => item.url);
  }

  async getAvliableLinkSiteMap(urls: string[],baseUrl:string){
    
    if (!urls.includes(baseUrl)) {
      urls.unshift(baseUrl);
      if (urls.length > 5 ) {
        urls.pop(); 
      }
    }


    const urlCharacterCounts: { url: string; characterCount: number }[] = [];
  
    // Crawl each unique URL and calculate the character count
    for (const uniqueURL of urls) {
      const characterCount = await this.getCharacterCount(uniqueURL);
      urlCharacterCounts.push({ url: uniqueURL, characterCount });
    }
    const sortedURLs = urlCharacterCounts.sort((a, b) => b.characterCount - a.characterCount);
    const primaryURLData = sortedURLs.find(item => item.url === baseUrl);
    let selectedURLs = [];
    let totalCharacterCount = 0;
    const minCharacterCount = 6000;
    const maxCharacterCount = 25000;


    selectedURLs.push(primaryURLData);
    totalCharacterCount = primaryURLData.characterCount;


    for (const urlData of sortedURLs) {
      if (urlData.url === baseUrl) {
        continue;
      }
     
      // Check if adding the next URL keeps the total within the 25,000 character limit
      if (totalCharacterCount + urlData.characterCount > maxCharacterCount) {
        continue;
      }

      selectedURLs.push(urlData);
      totalCharacterCount += urlData.characterCount;
      

      // If the total character count is within the range and we've added 4 or 5 URLs, stop adding more
      if (totalCharacterCount >= minCharacterCount && selectedURLs.length >= 4) {
        break;
      }
    }


    if (totalCharacterCount < minCharacterCount || selectedURLs.length < 2) {
        return await this.getAvliableLinkCherio(baseUrl)
    }

    return selectedURLs.map(item=>item.url)

  }
  
  

  async getCharacterCount(url: string): Promise<number> {
    try {
        const response = await axios.get(url);
        const bodyHTML = response.data;
        const $ = cheerio.load(bodyHTML);

        // Remove unwanted tags like script, style, etc.
        $('script, style').remove();

        // Extract text content from all elements in the body
        const textContent = $.text();

        // Remove extra whitespace (newlines, tabs, etc.) and calculate the length of the text content
        const cleanedText = textContent.replace(/\s+/g, ' ').trim();

        return cleanedText.length;
    } catch (err) {
        console.log(`Failed to fetch content from ${url}`, err);
        return 0; // In case of failure, return 0 to avoid breaking the process
    }
}

async getSitemapURLs(baseURL: string): Promise<string[]> {
  try {
    const sitemapURL = `${baseURL}/sitemap.xml`;
    const response = await axios.get(sitemapURL);
    const sitemapXML = response.data;
    
    // Parse sitemap XML
    const $ = cheerio.load(sitemapXML, { xmlMode: true });
    let urls: string[] = [];
    
    $('url > loc').each((i, elem) => {
      urls.push($(elem).text());
    });
    urls = [...new Set(urls)]
    if(urls.length > 4){
      return urls.slice(0,4)
    };

    return urls;

  } catch (err) {
    console.log(`Failed to fetch or parse sitemap for ${baseURL}`, err);
    return []; // Return an empty array if fetching or parsing the sitemap fails
  }
}

  //this service for emiit for crawler services
  async sendUrlToCrawler(botId: string, urlArray: string[]) {
    const dto = {
      botId,
      urlArray,
    };
    this.client.emit('aqkjtrhb-default', JSON.stringify(dto));
    return urlArray;
  }
}
