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
      const response = await axios.get(url);
      const bodyHTML = response.data;
      const $ = cheerio.load(bodyHTML);
      const links = $('a');
      const allFoundURLs = [];

      // Get base URL to use for relative URLs
      const baseURL = new URL(url).origin;

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

      // Remove duplicates
      const uniqueURLs = [...new Set(allFoundURLs)];

      // Create an array to store the URLs with their character counts
      const urlCharacterCounts = [];

      // Crawl each unique URL and calculate the character count
      for (const uniqueURL of uniqueURLs) {
        const characterCount = await this.getCharacterCount(uniqueURL);
        urlCharacterCounts.push({ url: uniqueURL, characterCount });
      };
      console.log(urlCharacterCounts)

      // Sort the URLs by character count in descending order and get the top 4
      const topURLs = urlCharacterCounts
        .sort((a, b) => b.characterCount - a.characterCount)
        .slice(0, 3)
        .map(item => item.url);


        topURLs.push(url)

      return topURLs;
    } catch (err) {
      console.log(err);
      throw new Error('Failed to fetch and parse URLs');
    }
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
