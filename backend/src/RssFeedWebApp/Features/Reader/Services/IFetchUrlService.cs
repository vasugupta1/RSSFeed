namespace RssFeedWebApp.Features.Reader.Services;

public interface IFetchUrlService
{
    Task<CleanHtml> GetUrlAsync(string url);
}